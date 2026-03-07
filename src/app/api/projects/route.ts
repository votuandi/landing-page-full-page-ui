import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects - Get all projects with pagination
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
    const isDisplay = searchParams.get('isDisplay')
    const showInHomepage = searchParams.get('showInHomepage')
    const orderBy = searchParams.get('orderBy') || 'order'
    const order = searchParams.get('order') || 'asc'
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (isDisplay !== null && isDisplay !== undefined) {
      where.isDisplay = isDisplay === 'true'
    }
    if (showInHomepage !== null && showInHomepage !== undefined) {
      where.showInHomepage = showInHomepage === 'true'
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
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          location: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          client: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Validate orderBy field
    const validOrderByFields = ['id', 'title', 'order', 'completedDate', 'createdAt', 'updatedAt']
    const orderByField = validOrderByFields.includes(orderBy) ? orderBy : 'order'

    // Build orderBy object
    const orderByClause: any = {}
    orderByClause[orderByField] = order === 'asc' ? 'asc' : 'desc'

    // Get total count
    const total = await prisma.project.count({ where })

    // Get paginated projects
    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByClause,
    })

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      location, 
      capacity, 
      completedDate, 
      imageUrl, 
      description, 
      detail,
      category, 
      client, 
      isDisplay, 
      showInHomepage,
      order
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title,
        location: location || null,
        capacity: capacity || null,
        completedDate: completedDate || null,
        imageUrl: imageUrl || null,
        description: description || null,
        detail: detail || null,
        category: category || 'Công nghiệp',
        client: client || null,
        isDisplay: isDisplay !== undefined ? isDisplay : true,
        showInHomepage: showInHomepage !== undefined ? showInHomepage : false,
        order: order !== undefined ? order : 0,
      }
    })

    // Associate orphaned media files with the newly created project
    // Extract media URLs from detail content (images and videos)
    if (detail) {
      try {
        const mediaUrls: string[] = []
        
        // Extract image URLs from <img> tags
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/g
        let match
        while ((match = imgRegex.exec(detail)) !== null) {
          mediaUrls.push(match[1])
        }
        
        // Extract video URLs from <video> and <source> tags
        const videoRegex = /<(?:video[^>]+src=["']([^"']+)["']|source[^>]+src=["']([^"']+)["'])/g
        while ((match = videoRegex.exec(detail)) !== null) {
          const url = match[1] || match[2]
          if (url) mediaUrls.push(url)
        }

        // Convert URLs to storage paths and update orphaned media records
        if (mediaUrls.length > 0) {
          const storagePaths = mediaUrls
            .filter(url => url.startsWith('/images/projects/') || url.startsWith('/videos/projects/'))
            .map(url => `public${url}`)

          if (storagePaths.length > 0) {
            await prisma.storageMedia.updateMany({
              where: {
                path: { in: storagePaths },
                parentId: null,
                parentType: 'project-text-editor'
              },
              data: {
                parentId: project.id
              }
            })
          }
        }
      } catch (mediaError) {
        console.error('Error associating media files:', mediaError)
        // Don't fail the project creation if media association fails
      }
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
