import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // divt-text-editor might send the file with different field names
    // Try common field names: 'image', 'file', 'upload'
    let file = formData.get('image') as File;
    if (!file) {
      file = formData.get('file') as File;
    }
    if (!file) {
      file = formData.get('upload') as File;
    }
    
    // Get serviceId from query params or form data
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId') || formData.get('serviceId') as string;

    if (!file) {
      // Log all form data keys for debugging
      const keys = Array.from(formData.keys());
      console.error('No file found. Available form data keys:', keys);
      return NextResponse.json(
        { error: 'No file provided', availableKeys: keys },
        { status: 400 }
      );
    }

    // Determine if file is image or video
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const isImage = imageTypes.includes(file.type);
    const isVideo = videoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, OGG, MOV) are allowed.',
          receivedType: file.type
        },
        { status: 400 }
      );
    }

    // Validate file size (images: 10MB, videos: 100MB)
    const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isImage ? '10MB' : '100MB'} limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename with timestamp
    const timestamp = Date.now();
    let filename: string;
    let uploadDir: string;
    let fileUrl: string;
    let filePath: string;

    if (isImage) {
      // Process images - convert to WebP
      filename = `service_${timestamp}.webp`;
      uploadDir = path.join(process.cwd(), 'public', 'images', 'services');
      
      // Create directory if it doesn't exist
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);

      // Convert image to WebP format using sharp
      await sharp(buffer)
        .resize(1200, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      fileUrl = `/images/services/${filename}`;
      filePath = `public/images/services/${filename}`;
    } else {
      // Process videos - save as-is
      const extension = file.name.split('.').pop() || 'mp4';
      filename = `service_${timestamp}.${extension}`;
      uploadDir = path.join(process.cwd(), 'public', 'videos', 'services');
      
      // Create directory if it doesn't exist
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      fileUrl = `/videos/services/${filename}`;
      filePath = `public/videos/services/${filename}`;
    }

    // Save to storage_medias table with parent_type = "service-text-editor"
    // For new services (serviceId = 0), save with parentId = null and include the path in response
    // The parent will update these records after the service is created
    try {
      const parentIdValue = serviceId && serviceId !== '0' ? parseInt(serviceId) : null;
      
      await prisma.storageMedia.create({
        data: {
          parentId: parentIdValue,
          type: isImage ? 'image' : 'video',
          parentType: 'service-text-editor',
          path: filePath,
        },
      });
    } catch (dbError) {
      console.error('Error saving to StorageMedia:', dbError);
      // Continue even if DB save fails - the file is already uploaded
    }

    // Return in the format expected by divt-text-editor
    return NextResponse.json(
      { 
        url: fileUrl,  // divt-text-editor expects 'url' field
        success: true,
        imageUrl: fileUrl,  // Keep for backwards compatibility
        filename,
        type: isImage ? 'image' : 'video',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
