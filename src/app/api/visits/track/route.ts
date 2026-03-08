import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/visits/track - Track a website visit
export async function POST(request: NextRequest) {
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

    // Get current date (without time) in UTC
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    
    // Upsert: increment views if record exists, create new record if it doesn't
    const visit = await prisma.visit.upsert({
      where: {
        date: today,
      },
      update: {
        views: {
          increment: 1,
        },
      },
      create: {
        date: today,
        views: 1,
      },
    })

    return NextResponse.json(
      { 
        success: true,
        date: visit.date,
        views: visit.views,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error tracking visit:', error)
    return NextResponse.json(
      { 
        error: 'Failed to track visit',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// GET /api/visits/track - Allow GET requests for easier tracking (e.g., from img tags)
export async function GET(request: NextRequest) {
  return POST(request)
}
