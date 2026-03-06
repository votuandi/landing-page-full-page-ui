import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/product-categories/[id] - Update a product category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, imageUrl } = body

    // Check if category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // If name is being changed, check if new name already exists
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.productCategory.findUnique({
        where: { name }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('Error updating product category:', error)
    return NextResponse.json(
      { error: 'Failed to update product category' },
      { status: 500 }
    )
  }
}

// DELETE /api/product-categories/[id] - Delete a product category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with products',
          message: `This category has ${existingCategory._count.products} product(s). Please delete or reassign the products first.`
        },
        { status: 409 }
      )
    }

    await prisma.productCategory.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting product category:', error)
    return NextResponse.json(
      { error: 'Failed to delete product category' },
      { status: 500 }
    )
  }
}
