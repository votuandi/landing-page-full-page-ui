import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/news - Get all news with pagination
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
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const orderBy = searchParams.get('orderBy') || 'publishedAt'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          excerpt: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Validate orderBy field
    const validOrderByFields = ['id', 'title', 'publishedAt', 'order', 'createdAt', 'updatedAt']
    const orderByField = validOrderByFields.includes(orderBy) ? orderBy : 'publishedAt'

    // Build orderBy object
    const orderByClause: any = {}
    orderByClause[orderByField] = order === 'asc' ? 'asc' : 'desc'

    // Get total count
    const total = await prisma.news.count({ where })

    // Get paginated news
    const news = await prisma.news.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByClause,
    })

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/news - Create a new news article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      excerpt, 
      content, 
      author, 
      category, 
      readTime, 
      imageUrl, 
      tags, 
      isActive, 
      order,
      publishedAt 
    } = body

    // Validate required fields
    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, excerpt, and content are required' },
        { status: 400 }
      )
    }

    const news = await prisma.news.create({
      data: {
        title,
        excerpt,
        content,
        author: author || 'Administrator',
        category: category || 'Tin tức',
        readTime: readTime || '5 phút đọc',
        imageUrl: imageUrl || null,
        tags: tags || [],
        isActive: isActive !== undefined ? isActive : true,
        order: order !== undefined ? order : 0,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      }
    })

    // Associate orphaned media files with the newly created news
    // Extract media URLs from content (images and videos)
    try {
      const mediaUrls: string[] = []
      
      // Extract image URLs from <img> tags
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/g
      let match
      while ((match = imgRegex.exec(content)) !== null) {
        mediaUrls.push(match[1])
      }
      
      // Extract video URLs from <video> and <source> tags
      const videoRegex = /<(?:video[^>]+src=["']([^"']+)["']|source[^>]+src=["']([^"']+)["'])/g
      while ((match = videoRegex.exec(content)) !== null) {
        const url = match[1] || match[2]
        if (url) mediaUrls.push(url)
      }

      // Convert URLs to storage paths and update orphaned media records
      if (mediaUrls.length > 0) {
        const storagePaths = mediaUrls
          .filter(url => url.startsWith('/news/'))
          .map(url => `public${url}`)

        if (storagePaths.length > 0) {
          await prisma.storageMedia.updateMany({
            where: {
              path: { in: storagePaths },
              parentId: null,
              parentType: 'news-text-editor'
            },
            data: {
              parentId: news.id
            }
          })
        }
      }
    } catch (mediaError) {
      console.error('Error associating media files:', mediaError)
      // Don't fail the news creation if media association fails
    }

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
