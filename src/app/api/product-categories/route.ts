import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/product-categories - Get all product categories with pagination
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const skip = (page - 1) * limit

    // Validate orderBy field
    const validOrderByFields = ['id', 'name', 'createdAt', 'updatedAt']
    const orderByField = validOrderByFields.includes(orderBy) ? orderBy : 'createdAt'

    // Build orderBy object
    const orderByClause: any = {}
    orderByClause[orderByField] = order === 'asc' ? 'asc' : 'desc'

    // Get total count
    const total = await prisma.productCategory.count()

    // Get paginated categories
    const categories = await prisma.productCategory.findMany({
      skip,
      take: limit,
      orderBy: orderByClause,
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching product categories:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch product categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/product-categories - Create a new product category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, imageUrl } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating product category:', error)
    return NextResponse.json(
      { error: 'Failed to create product category' },
      { status: 500 }
    )
  }
}
