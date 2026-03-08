import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/[id]/images - Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Fetch all images from StorageMedia where:
    // - parentId = productId
    // - parentType = "product" OR "product-text-editor"
    const images = await prisma.storageMedia.findMany({
      where: {
        parentId: productId,
        parentType: {
          in: ['product', 'product-text-editor']
        },
        type: 'image'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Convert paths to URLs
    const imageUrls = images.map(image => ({
      id: image.id,
      url: image.path.replace('public', ''),
      type: image.parentType,
      createdAt: image.createdAt
    }));

    return NextResponse.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch product images',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
