import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaIds } = body;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'No media IDs provided' },
        { status: 400 }
      );
    }

    // Get the media records to find their file paths
    const mediaRecords = await prisma.storageMedia.findMany({
      where: {
        id: {
          in: mediaIds
        }
      }
    });

    if (mediaRecords.length === 0) {
      return NextResponse.json(
        { error: 'No media records found' },
        { status: 404 }
      );
    }

    // Delete files from filesystem
    const deletionResults = [];
    for (const media of mediaRecords) {
      try {
        const filepath = path.join(process.cwd(), media.path);
        if (existsSync(filepath)) {
          await unlink(filepath);
          deletionResults.push({
            id: media.id,
            path: media.path,
            deleted: true
          });
        } else {
          deletionResults.push({
            id: media.id,
            path: media.path,
            deleted: false,
            reason: 'File not found'
          });
        }
      } catch (error) {
        console.error(`Error deleting file ${media.path}:`, error);
        deletionResults.push({
          id: media.id,
          path: media.path,
          deleted: false,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Delete records from database
    const deleteResult = await prisma.storageMedia.deleteMany({
      where: {
        id: {
          in: mediaIds
        }
      }
    });

    return NextResponse.json(
      { 
        success: true,
        deletedCount: deleteResult.count,
        deletionResults
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting storage media:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete storage media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
