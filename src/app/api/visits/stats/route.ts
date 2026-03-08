import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/visits/stats - Get visit statistics by day
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is not set. Please check your .env file.',
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const limitNum = limit ? parseInt(limit, 10) : null

    // Build query options
    const queryOptions: any = {
      orderBy: {
        date: 'desc',
      },
    }

    if (limitNum && limitNum > 0) {
      queryOptions.take = limitNum
    }

    // Fetch visits from database
    const visits = await prisma.visit.findMany(queryOptions)

    // Format the response as requested: date=01 month=01 year=2026 views=73
    const formattedStats = visits.map((visit) => {
      const date = new Date(visit.date)
      const day = String(date.getUTCDate()).padStart(2, '0')
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const year = date.getUTCFullYear()

      return {
        date: day,
        month: month,
        year: year,
        views: visit.views,
      }
    })

    return NextResponse.json(
      {
        stats: formattedStats,
        total: formattedStats.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching visit stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch visit statistics',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
