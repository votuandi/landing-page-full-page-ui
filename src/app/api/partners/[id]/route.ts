import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDeleteImage } from '@/lib/imageUtils'

// PUT /api/partners/[id] - Update a partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()
    const {
      name,
      image,
      order,
      isActive,
    } = body

    // If image is being updated, get the old image to delete it
    let oldImageUrl: string | null = null;
    if (image !== undefined) {
      const existingPartner = await prisma.partner.findUnique({
        where: { id },
        select: { image: true },
      });
      oldImageUrl = existingPartner?.image || null;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    // Delete old image if it was replaced and is different from new image
    if (oldImageUrl && image && oldImageUrl !== image) {
      await safeDeleteImage(oldImageUrl);
    }

    return NextResponse.json(partner, { status: 200 })
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners/[id] - Delete a partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    // Get the partner to retrieve the image URL before deletion
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: { image: true },
    });

    // Delete from database
    await prisma.partner.delete({
      where: { id },
    })

    // Delete the image file if it exists
    if (partner?.image) {
      await safeDeleteImage(partner.image);
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    )
  }
}
