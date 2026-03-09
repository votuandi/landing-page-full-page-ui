import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'

const EXCLUDED_DIRS = ['backup', 'logs']

function getAllFiles(
  dir: string,
  baseDir: string,
  excludePrefixes: string[],
  files: { absolute: string; relative: string }[] = []
): { absolute: string; relative: string }[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)
    const relativeNormalized = path.normalize(relativePath).replace(/\\/g, '/')

    const isExcluded = excludePrefixes.some(
      (prefix) =>
        relativeNormalized === prefix ||
        relativeNormalized.startsWith(prefix + '/')
    )
    if (isExcluded) continue

    if (entry.isDirectory()) {
      getAllFiles(fullPath, baseDir, excludePrefixes, files)
    } else {
      files.push({ absolute: fullPath, relative: relativePath.replace(/\\/g, '/') })
    }
  }
  return files
}

export async function GET() {
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

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json(
        { error: 'Public directory not found' },
        { status: 404 }
      )
    }

    const backupDir = path.join(publicDir, 'backup')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5)
    const zipFileName = `backup_${timestamp}.zip`
    const zipPath = path.join(backupDir, zipFileName)

    const allFiles = getAllFiles(publicDir, publicDir, EXCLUDED_DIRS)

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => resolve())
      archive.on('error', (err) => reject(err))
      output.on('error', (err) => reject(err))

      archive.pipe(output)

      for (const { absolute, relative } of allFiles) {
        archive.file(absolute, { name: relative })
      }

      archive.finalize()
    })

    // Delete old backup zip files (keep only the one just created)
    const backupFiles = fs.readdirSync(backupDir)
    const backupZipPattern = /^backup_.*\.zip$/
    for (const name of backupFiles) {
      if (backupZipPattern.test(name) && name !== zipFileName) {
        try {
          fs.unlinkSync(path.join(backupDir, name))
        } catch (unlinkErr) {
          console.error('Error deleting old backup file:', name, unlinkErr)
        }
      }
    }

    // Log media backup history (at most one record per user per 60s to avoid duplicates from retries/double-requests)
    try {
      const recent = await prisma.backupHistory.findFirst({
        where: {
          type: 'media',
          action: 'backup',
          status: 'success',
          performerId: payload.userId,
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
      })
      if (!recent) {
        await prisma.backupHistory.create({
          data: {
            action: 'backup',
            status: 'success',
            type: 'media',
            performerId: payload.userId,
            performerUsername: payload.username,
          },
        })
      }
    } catch (historyError) {
      console.error('Error logging media backup history:', historyError)
    }

    const stat = fs.statSync(zipPath)
    const stream = fs.createReadStream(zipPath)

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': String(stat.size),
      },
    })
  } catch (error) {
    console.error('Media backup error:', error)
    try {
      const accessToken = await getAccessToken()
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken)
        if (payload) {
          await prisma.backupHistory.create({
            data: {
              action: 'backup',
              status: 'failed',
              type: 'media',
              performerId: payload.userId,
              performerUsername: payload.username,
              errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          })
        }
      }
    } catch (historyError) {
      console.error('Error logging media backup history:', historyError)
    }
    return NextResponse.json(
      {
        error: 'Failed to create media backup',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
