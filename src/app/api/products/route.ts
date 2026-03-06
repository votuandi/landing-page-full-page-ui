import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Get all products with pagination
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
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const isBestSeller = searchParams.get('isBestSeller')
    const showInHomePage = searchParams.get('showInHomePage')
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    if (isBestSeller !== null && isBestSeller !== undefined) {
      where.isBestSeller = isBestSeller === 'true'
    }
    if (showInHomePage !== null && showInHomePage !== undefined) {
      where.showInHomePage = showInHomePage === 'true'
    }
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Validate orderBy field
    const validOrderByFields = ['id', 'title', 'price', 'order', 'createdAt', 'updatedAt']
    const orderByField = validOrderByFields.includes(orderBy) ? orderBy : 'createdAt'

    // Build orderBy object
    const orderByClause: any = {}
    orderByClause[orderByField] = order === 'asc' ? 'asc' : 'desc'

    // Get total count
    const total = await prisma.product.count({ where })

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, introduction, description, specifications, guarantee, categoryId, price, original_price, isActive, isBestSeller, showInHomePage, imageUrl, order } = body

    // Validate required fields
    if (!title || !categoryId) {
      return NextResponse.json(
        { error: 'Title and categoryId are required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title,
        introduction: introduction || null,
        description: description || null,
        specifications: specifications || null,
        guarantee: guarantee || null,
        categoryId,
        price: price || null,
        original_price: original_price || null,
        isActive: isActive !== undefined ? isActive : true,
        isBestSeller: isBestSeller !== undefined ? isBestSeller : false,
        showInHomePage: showInHomePage !== undefined ? showInHomePage : false,
        imageUrl: imageUrl || null,
        order: order !== undefined ? order : 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
