import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// GET /api/products/[id] - Get a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, introduction, description, specifications, guarantee, categoryId, price, original_price, isActive, isBestSeller, showInHomePage, imageUrl, order } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // If categoryId is being changed, check if new category exists
    if (categoryId && categoryId !== existingProduct.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(introduction !== undefined && { introduction }),
        ...(description !== undefined && { description }),
        ...(specifications !== undefined && { specifications }),
        ...(guarantee !== undefined && { guarantee }),
        ...(categoryId && { categoryId }),
        ...(price !== undefined && { price }),
        ...(original_price !== undefined && { original_price }),
        ...(isActive !== undefined && { isActive }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(showInHomePage !== undefined && { showInHomePage }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(order !== undefined && { order }),
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

    // Associate orphaned media files if content fields were updated
    if (description !== undefined || specifications !== undefined || guarantee !== undefined) {
      try {
        const mediaUrls: string[] = []
        const contentFields = [description, specifications, guarantee].filter(Boolean)
        
        for (const content of contentFields) {
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
        }

        // Convert URLs to storage paths and update orphaned media records
        if (mediaUrls.length > 0) {
          const storagePaths = mediaUrls
            .filter(url => url.startsWith('/images/products/') || url.startsWith('/videos/products/'))
            .map(url => `public${url}`)

          if (storagePaths.length > 0) {
            await prisma.storageMedia.updateMany({
              where: {
                path: { in: storagePaths },
                parentId: null,
                parentType: 'product-text-editor'
              },
              data: {
                parentId: id
              }
            })
          }
        }
      } catch (mediaError) {
        console.error('Error associating media files:', mediaError)
        // Don't fail the product update if media association fails
      }
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get all related storage media
    const storageMedias = await prisma.storageMedia.findMany({
      where: {
        parentId: id,
        OR: [
          { parentType: 'product' },
          { parentType: 'product-text-editor' }
        ]
      }
    })

    // Collect all file paths to delete
    const filesToDelete: string[] = []
    
    // Add main product image if exists
    if (existingProduct.imageUrl) {
      // Convert URL to file path
      const imagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl)
      filesToDelete.push(imagePath)
    }

    // Add all storage media files
    storageMedias.forEach(media => {
      const mediaPath = path.join(process.cwd(), media.path)
      filesToDelete.push(mediaPath)
    })

    // Delete files from filesystem
    const deletionResults = []
    for (const filepath of filesToDelete) {
      try {
        if (existsSync(filepath)) {
          await unlink(filepath)
          deletionResults.push({
            path: filepath,
            deleted: true
          })
        } else {
          deletionResults.push({
            path: filepath,
            deleted: false,
            reason: 'File not found'
          })
        }
      } catch (error) {
        console.error(`Error deleting file ${filepath}:`, error)
        deletionResults.push({
          path: filepath,
          deleted: false,
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Delete storage media records from database
    await prisma.storageMedia.deleteMany({
      where: {
        parentId: id,
        OR: [
          { parentType: 'product' },
          { parentType: 'product-text-editor' }
        ]
      }
    })

    // Delete the product from database
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Product deleted successfully',
        filesDeleted: deletionResults.filter(r => r.deleted).length,
        filesNotFound: deletionResults.filter(r => !r.deleted && r.reason === 'File not found').length,
        deletionResults
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
