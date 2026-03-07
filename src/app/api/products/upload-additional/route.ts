import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const productId = formData.get('productId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type for ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.` },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
    }

    // Define the directory path
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products');
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedImages = [];

    // Process each file
    for (const file of files) {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate filename with timestamp
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const filename = `product_${timestamp}_${randomSuffix}.webp`;
      
      // Full file path
      const filepath = path.join(uploadDir, filename);

      // Convert image to WebP format using sharp
      // Resize to max 1200px width while maintaining aspect ratio
      await sharp(buffer)
        .resize(1200, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Return the public URL path
      const imageUrl = `/images/products/${filename}`;
      const imagePath = `public/images/products/${filename}`;

      // Save to storage_medias table if productId is provided
      if (productId && productId !== '0') {
        await prisma.storageMedia.create({
          data: {
            parentId: parseInt(productId),
            type: 'image',
            parentType: 'product',
            path: imagePath,
          },
        });
      }

      uploadedImages.push({
        imageUrl,
        path: imagePath,
        filename,
      });
    }

    return NextResponse.json(
      { 
        success: true,
        images: uploadedImages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload images',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
