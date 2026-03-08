import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/admin/visits - Get visit tracker data (admin only)
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
    const limit = parseInt(searchParams.get('limit') || '30') // Default to last 30 days
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else {
      // Default to last N days
      const endDateObj = new Date()
      const startDateObj = new Date()
      startDateObj.setDate(startDateObj.getDate() - limit)
      where.date = {
        gte: startDateObj,
        lte: endDateObj,
      }
    }

    // Fetch visit data
    const visits = await prisma.visit.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    })

    // Calculate statistics
    const totalViews = visits.reduce((sum, visit) => sum + visit.views, 0)
    const averageViews = visits.length > 0 ? Math.round(totalViews / visits.length) : 0
    const maxViews = visits.length > 0 ? Math.max(...visits.map(v => v.views)) : 0
    const minViews = visits.length > 0 ? Math.min(...visits.map(v => v.views)) : 0

    // Get today's visits
    // Format today's date as YYYY-MM-DD string to match PostgreSQL date format
    const now = new Date()
    const todayString = now.toISOString().split('T')[0] // Format: YYYY-MM-DD
    
    // First, check if today is in the visits array we already fetched
    let todayVisit = visits.find(visit => {
      const visitDateString = new Date(visit.date).toISOString().split('T')[0]
      return visitDateString === todayString
    })
    
    // If not found in the array, query the database using raw SQL for exact date match
    if (!todayVisit) {
      const result = await prisma.$queryRaw<Array<{ id: number; date: Date; views: number; createdAt: Date; updatedAt: Date }>>`
        SELECT * FROM "Visit" WHERE date = ${todayString}::date
      `
      if (result && result.length > 0) {
        todayVisit = {
          id: result[0].id,
          date: result[0].date,
          views: result[0].views,
          createdAt: result[0].createdAt,
          updatedAt: result[0].updatedAt,
        }
      }
    }

    return NextResponse.json({
      visits,
      statistics: {
        totalViews,
        averageViews,
        maxViews,
        minViews,
        totalDays: visits.length,
        todayViews: todayVisit?.views || 0,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching visit tracker data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch visit tracker data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
