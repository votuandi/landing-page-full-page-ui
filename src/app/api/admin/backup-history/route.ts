import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/admin/backup-history - Get backup/restore history
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch backup history
    const [history, total] = await Promise.all([
      prisma.backupHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.backupHistory.count(),
    ])

    return NextResponse.json(
      {
        success: true,
        data: history,
        total,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching backup history:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch backup history',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
