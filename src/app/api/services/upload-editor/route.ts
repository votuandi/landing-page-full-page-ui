import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // divt-text-editor might send the file with different field names
    // Try both 'file' and 'image'
    const file = formData.get('file') as File | null || formData.get('image') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, OGG) are allowed.' },
        { status: 400 }
      );
    }

    const isVideo = validVideoTypes.includes(file.type);
    const isImage = validImageTypes.includes(file.type);

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? '50MB' : '10MB'} limit` },
        { status: 400 }
      );
    }

    // Get serviceId from query params (optional)
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    // Create upload directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'services', 'editor');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = isVideo ? path.extname(file.name) : '.webp';
    const fileName = `service-editor-${serviceId || 'new'}-${timestamp}-${randomString}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    if (isVideo) {
      // For videos, save directly without conversion
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
    } else if (isImage) {
      // For images, convert to WebP format
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Convert to WebP using sharp
      await sharp(buffer)
        .webp({ quality: 85 })
        .toFile(filePath);
    }

    // Generate public URL
    const fileUrl = `/uploads/services/editor/${fileName}`;

    // Return in the format expected by divt-text-editor
    return NextResponse.json({
      success: true,
      url: fileUrl,  // divt-text-editor expects 'url' field
      message: `${isVideo ? 'Video' : 'Image'} uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
