import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteImageFile } from '@/lib/imageUtils'

// GET /api/news/[id] - Get a single news article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid news ID' },
        { status: 400 }
      )
    }

    const news = await prisma.news.findUnique({
      where: { id }
    })

    if (!news) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(news, { status: 200 })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// PUT /api/news/[id] - Update a news article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid news ID' },
        { status: 400 }
      )
    }

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

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (author !== undefined) updateData.author = author
    if (category !== undefined) updateData.category = category
    if (readTime !== undefined) updateData.readTime = readTime
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (tags !== undefined) updateData.tags = tags
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt)

    const news = await prisma.news.update({
      where: { id },
      data: updateData
    })

    // Associate orphaned media files if content was updated
    if (content !== undefined) {
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
                parentId: id
              }
            })
          }
        }
      } catch (mediaError) {
        console.error('Error associating media files:', mediaError)
        // Don't fail the news update if media association fails
      }
    }

    return NextResponse.json(news, { status: 200 })
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    )
  }
}

// DELETE /api/news/[id] - Delete a news article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid news ID' },
        { status: 400 }
      )
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    // Get all StorageMedia records associated with this news article
    const storageMediaRecords = await prisma.storageMedia.findMany({
      where: {
        parentType: 'news-text-editor',
        parentId: id
      }
    })

    // Delete the news article from database
    await prisma.news.delete({
      where: { id }
    })

    // Delete the main news image file if it exists
    if (existingNews.imageUrl) {
      await deleteImageFile(existingNews.imageUrl)
    }

    // Delete all StorageMedia records associated with this news
    if (storageMediaRecords.length > 0) {
      await prisma.storageMedia.deleteMany({
        where: {
          parentType: 'news-text-editor',
          parentId: id
        }
      })

      // Delete the actual files from storage
      for (const record of storageMediaRecords) {
        if (record.path) {
          // Convert storage path to public URL format
          // path is stored as "public/news/..." so we need to extract "/news/..."
          const publicUrl = record.path.replace(/^public/, '')
          await deleteImageFile(publicUrl)
        }
      }
    }

    return NextResponse.json(
      { message: 'News deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting news:', error)
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    )
  }
}
