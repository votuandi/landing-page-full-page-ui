import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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
        },
        storageMedias: {
          where: {
            parentType: 'product'
          }
        }
      }
    })

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

    // Check if product exists and get all related data
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        storageMedias: {
          where: {
            OR: [
              { parentType: 'product' },
              { parentType: 'product-text-editor' }
            ]
          }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Collect all file paths to delete
    const filesToDelete: string[] = []
    
    // Add main product image if exists
    if (existingProduct.imageUrl) {
      // Convert URL to file path
      const imagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl)
      filesToDelete.push(imagePath)
    }

    // Add all storage media files
    existingProduct.storageMedias.forEach(media => {
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
