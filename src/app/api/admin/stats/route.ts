import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is not set. Please check your .env file.',
          hint: 'Make sure you have a .env file with DATABASE_URL configured.'
        },
        { status: 500 }
      )
    }

    // Fetch all statistics in parallel for better performance
    const [
      totalProducts,
      activeProducts,
      totalProjects,
      totalNews,
      totalLeads,
      totalServices,
      totalBranches
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.news.count(),
      prisma.contactForm.count(),
      prisma.service.count(),
      prisma.office.count()
    ])

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalProjects,
      totalNews,
      totalLeads,
      totalServices,
      totalBranches
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}