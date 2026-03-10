import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import { runMediaBackup } from '@/lib/backup'

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

    const zipPath = await runMediaBackup({
      userId: payload.userId,
      username: payload.username,
    })

    const zipFileName = path.basename(zipPath)
    const stat = fs.statSync(zipPath)
    const stream = fs.createReadStream(zipPath)

    return new NextResponse(stream as unknown as BodyInit, {
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
