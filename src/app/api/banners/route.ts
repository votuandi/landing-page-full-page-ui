import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/banners - Get all banners
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

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const orderBy = searchParams.get('orderBy') || 'order'

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Validate orderBy field - only allow valid Banner model fields
    const validOrderByFields = ['order', 'id', 'createdAt', 'updatedAt', 'title']
    const orderByField = validOrderByFields.includes(orderBy) ? orderBy : 'order'

    // Build orderBy object based on the field
    let orderByClause: any = {}
    switch (orderByField) {
      case 'order':
        orderByClause = { order: 'asc' }
        break
      case 'id':
        orderByClause = { id: 'asc' }
        break
      case 'createdAt':
        orderByClause = { createdAt: 'asc' }
        break
      case 'updatedAt':
        orderByClause = { updatedAt: 'asc' }
        break
      case 'title':
        orderByClause = { title: 'asc' }
        break
      default:
        orderByClause = { order: 'asc' }
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: orderByClause,
    })

    return NextResponse.json(banners, { status: 200 })
  } catch (error) {
    console.error('Error fetching banners:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    // Provide more helpful error messages based on error type
    let userFriendlyMessage = errorMessage
    if (errorMessage.includes('P1001') || errorMessage.includes('Can\'t reach database server')) {
      userFriendlyMessage = 'Cannot connect to database. Please check your DATABASE_URL and ensure the database server is running.'
    } else if (errorMessage.includes('P2025') || errorMessage.includes('Record to update not found')) {
      userFriendlyMessage = 'Database record not found.'
    } else if (errorMessage.includes('P2002') || errorMessage.includes('Unique constraint')) {
      userFriendlyMessage = 'Database constraint violation.'
    } else if (errorMessage.includes('PrismaClient')) {
      userFriendlyMessage = 'Prisma client error. Please run: npm run db:generate'
    }
    
    console.error('Error details:', errorDetails)
    return NextResponse.json(
      { 
        error: 'Failed to fetch banners',
        message: userFriendlyMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails, originalError: errorMessage })
      },
      { status: 500 }
    )
  }
}

// POST /api/banners - Create a new banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      backgroundImage,
      backgroundColor,
      isActive,
      order,
    } = body

    // Validate required fields
    if (!title || !backgroundImage) {
      return NextResponse.json(
        { error: 'Title and backgroundImage are required' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        backgroundImage,
        backgroundColor,
        isActive: isActive !== undefined ? isActive : true,
        order: order !== undefined ? order : 0,
      },
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
