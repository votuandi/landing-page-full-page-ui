import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/partners - Get all partners
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

    // Validate orderBy field - only allow valid Partner model fields
    const validOrderByFields = ['order', 'id', 'createdAt', 'updatedAt', 'name']
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
      case 'name':
        orderByClause = { name: 'asc' }
        break
      default:
        orderByClause = { order: 'asc' }
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: orderByClause,
    })

    return NextResponse.json(partners, { status: 200 })
  } catch (error) {
    console.error('Error fetching partners:', error)
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
        error: 'Failed to fetch partners',
        message: userFriendlyMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails, originalError: errorMessage })
      },
      { status: 500 }
    )
  }
}

// POST /api/partners - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      image,
      order,
      isActive,
    } = body

    // Validate required fields
    if (!name || !image) {
      return NextResponse.json(
        { error: 'Name and image are required' },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        image,
        isActive: isActive !== undefined ? isActive : true,
        order: order !== undefined ? order : 0,
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}
