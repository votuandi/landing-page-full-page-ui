import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteImageFile } from '@/lib/imageUtils'

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project, { status: 200 })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

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

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingProject.title,
        location: location !== undefined ? location : existingProject.location,
        capacity: capacity !== undefined ? capacity : existingProject.capacity,
        completedDate: completedDate !== undefined ? completedDate : existingProject.completedDate,
        imageUrl: imageUrl !== undefined ? imageUrl : existingProject.imageUrl,
        description: description !== undefined ? description : existingProject.description,
        detail: detail !== undefined ? detail : existingProject.detail,
        category: category !== undefined ? category : existingProject.category,
        client: client !== undefined ? client : existingProject.client,
        isDisplay: isDisplay !== undefined ? isDisplay : existingProject.isDisplay,
        showInHomepage: showInHomepage !== undefined ? showInHomepage : existingProject.showInHomepage,
        order: order !== undefined ? order : existingProject.order,
      }
    })

    // Update media associations if detail content changed
    if (detail !== undefined && detail !== existingProject.detail) {
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
        // Don't fail the project update if media association fails
      }
    }

    return NextResponse.json(project, { status: 200 })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get all StorageMedia records associated with this project
    const storageMediaRecords = await prisma.storageMedia.findMany({
      where: {
        parentType: 'project-text-editor',
        parentId: id
      }
    })

    // Delete the main project image file if it exists (before deleting from DB)
    if (existingProject.imageUrl) {
      await deleteImageFile(existingProject.imageUrl)
    }

    // Delete all StorageMedia files from storage (before deleting from DB)
    if (storageMediaRecords.length > 0) {
      for (const record of storageMediaRecords) {
        if (record.path) {
          // Convert storage path to public URL format
          // path is stored as "public/images/projects/..." so we need to extract "/images/projects/..."
          const publicUrl = record.path.replace(/^public/, '')
          await deleteImageFile(publicUrl)
        }
      }

      // Delete all StorageMedia records from database
      await prisma.storageMedia.deleteMany({
        where: {
          parentType: 'project-text-editor',
          parentId: id
        }
      })
    }

    // Finally, delete the project from database
    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
