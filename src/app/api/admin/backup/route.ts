import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'
import { exportDatabaseBackupData } from '@/lib/backup'

// GET /api/admin/backup - Export entire database to JSON
export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
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

    const backupData = await exportDatabaseBackupData(payload.username)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `database-backup-${timestamp}.json`

    try {
      await prisma.backupHistory.create({
        data: {
          action: 'backup',
          status: 'success',
          type: 'database',
          performerId: payload.userId,
          performerUsername: payload.username,
        },
      })
    } catch (historyError) {
      console.error('Error logging backup history:', historyError)
    }

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    
    // Log failed backup history
    try {
      const accessToken = await getAccessToken()
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken)
        if (payload) {
          await prisma.backupHistory.create({
            data: {
              action: 'backup',
              status: 'failed',
              type: 'database',
              performerId: payload.userId,
              performerUsername: payload.username,
              errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          })
        }
      }
    } catch (historyError) {
      console.error('Error logging backup history:', historyError)
    }

    return NextResponse.json(
      {
        error: 'Failed to create backup',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
