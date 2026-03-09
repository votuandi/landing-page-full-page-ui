import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'

const EXCLUDED_DIRS = ['backup', 'logs']
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]) // PK..
const ZIP_EMPTY_OR_EOCD = Buffer.from([0x50, 0x4b, 0x05, 0x06])

function isZipBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  const sig = buffer.subarray(0, 4)
  return sig.equals(ZIP_MAGIC) || sig.equals(ZIP_EMPTY_OR_EOCD) || (buffer[0] === 0x50 && buffer[1] === 0x4b)
}

function isPathSafe(entryPath: string): { safe: boolean; reason?: string } {
  const normalized = path.normalize(entryPath).replace(/\\/g, '/')
  if (normalized.includes('..')) {
    return { safe: false, reason: 'Path traversal (..) is not allowed' }
  }
  const topDir = normalized.split('/')[0] || ''
  if (EXCLUDED_DIRS.includes(topDir)) {
    return { safe: false, reason: `Extraction into "${topDir}/" is not allowed` }
  }
  return { safe: true }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .zip files are allowed.' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!isZipBuffer(buffer)) {
      return NextResponse.json(
        { error: 'Invalid zip file. The file does not appear to be a valid ZIP archive.' },
        { status: 400 }
      )
    }

    let zip: AdmZip
    try {
      zip = new AdmZip(buffer)
    } catch (zipError) {
      return NextResponse.json(
        {
          error: 'Invalid or corrupted zip file. Could not read archive.',
          details: process.env.NODE_ENV === 'development' && zipError instanceof Error ? zipError.message : undefined,
        },
        { status: 400 }
      )
    }

    const entries = zip.getEntries()
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'Invalid zip file. No entries found.' },
        { status: 400 }
      )
    }

    for (const entry of entries) {
      const entryPath = (entry.entryName ?? '').replace(/\\/g, '/')
      if (!entryPath) continue
      const result = isPathSafe(entryPath)
      if (!result.safe) {
        return NextResponse.json(
          { error: `Invalid archive: ${result.reason} (entry: ${entryPath})` },
          { status: 400 }
        )
      }
    }

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const resolvedPublic = path.resolve(publicDir)

    for (const entry of entries) {
      const entryPath = (entry.entryName ?? '').replace(/\\/g, '/')
      if (!entryPath) continue

      const extractPath = path.join(resolvedPublic, path.normalize(entryPath))
      const normalizedExtract = path.normalize(extractPath)
      if (normalizedExtract.indexOf(resolvedPublic) !== 0) {
        return NextResponse.json(
          { error: 'Invalid archive: path would escape destination.' },
          { status: 400 }
        )
      }

      if (entry.isDirectory) {
        await fs.promises.mkdir(extractPath, { recursive: true })
        continue
      }

      await fs.promises.mkdir(path.dirname(extractPath), { recursive: true })
      const data = entry.getData()
      if (data && Buffer.isBuffer(data)) {
        await fs.promises.writeFile(extractPath, data)
      }
    }

    // Log media restore history
    try {
      await prisma.backupHistory.create({
        data: {
          action: 'restore',
          status: 'success',
          type: 'media',
          performerId: payload.userId,
          performerUsername: payload.username,
        },
      })
    } catch (historyError) {
      console.error('Error logging media restore history:', historyError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Media restored successfully.',
        restoredFiles: entries.length,
        restoredAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Media restore error:', error)
    try {
      const accessToken = await getAccessToken()
      if (accessToken) {
        const restorePayload = await verifyAccessToken(accessToken)
        if (restorePayload) {
          await prisma.backupHistory.create({
            data: {
              action: 'restore',
              status: 'failed',
              type: 'media',
              performerId: restorePayload.userId,
              performerUsername: restorePayload.username,
              errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          })
        }
      }
    } catch (historyError) {
      console.error('Error logging media restore history:', historyError)
    }
    return NextResponse.json(
      {
        error: 'Failed to restore media',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
