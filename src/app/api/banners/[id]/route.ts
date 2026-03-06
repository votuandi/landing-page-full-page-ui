import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/banners/[id] - Get a single banner by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(banner, { status: 200 })
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

// PUT /api/banners/[id] - Update a banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      backgroundImage,
      backgroundColor,
      isActive,
      order,
    } = body

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    // Update banner
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(buttonText !== undefined && { buttonText }),
        ...(buttonLink !== undefined && { buttonLink }),
        ...(backgroundImage !== undefined && { backgroundImage }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json(banner, { status: 200 })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

// DELETE /api/banners/[id] - Delete a banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    // Delete banner
    await prisma.banner.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Banner deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
