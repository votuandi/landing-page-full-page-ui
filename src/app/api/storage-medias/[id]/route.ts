import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// DELETE /api/storage-medias/[id] - Delete a storage media and its file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid storage media ID' },
        { status: 400 }
      );
    }

    // Get the storage media record
    const storageMedia = await prisma.storageMedia.findUnique({
      where: { id }
    });

    if (!storageMedia) {
      return NextResponse.json(
        { error: 'Storage media not found' },
        { status: 404 }
      );
    }

    // Delete the file from filesystem
    const filepath = path.join(process.cwd(), storageMedia.path);
    if (existsSync(filepath)) {
      try {
        await unlink(filepath);
        console.log(`Deleted file: ${filepath}`);
      } catch (fileError) {
        console.error(`Failed to delete file: ${filepath}`, fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await prisma.storageMedia.delete({
      where: { id }
    });

    return NextResponse.json(
      { success: true, message: 'Storage media deleted successfully' },
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
