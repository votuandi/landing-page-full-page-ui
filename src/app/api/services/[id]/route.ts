import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteImageFile } from "@/lib/imageUtils";

// GET /api/services/[id] - Get a single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    const serviceRaw = await prisma.service.findUnique({
      where: { id },
    });

    if (!serviceRaw) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const service = {
      ...serviceRaw,
      benefits: serviceRaw.benefits ? JSON.parse(serviceRaw.benefits) : null,
      implementationProcess: serviceRaw.implementationProcess ? JSON.parse(serviceRaw.implementationProcess) : null,
    };

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id] - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      image,
      features,
      price,
      category,
      duration,
      warranty,
      benefits,
      implementationProcess,
      isActive,
      order,
    } = body;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Update service
    const serviceRaw = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(features !== undefined && { features }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(duration !== undefined && { duration }),
        ...(warranty !== undefined && { warranty }),
        ...(benefits !== undefined && { benefits: benefits ? JSON.stringify(benefits) : null }),
        ...(implementationProcess !== undefined && { implementationProcess: implementationProcess ? JSON.stringify(implementationProcess) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });

    // Associate orphaned media files if description was updated
    if (description !== undefined) {
      try {
        const mediaUrls: string[] = [];
        
        // Extract image URLs from <img> tags
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
        let match;
        while ((match = imgRegex.exec(description)) !== null) {
          mediaUrls.push(match[1]);
        }
        
        // Extract video URLs from <video> and <source> tags
        const videoRegex = /<(?:video[^>]+src=["']([^"']+)["']|source[^>]+src=["']([^"']+)["'])/g;
        while ((match = videoRegex.exec(description)) !== null) {
          const url = match[1] || match[2];
          if (url) mediaUrls.push(url);
        }

        // Convert URLs to storage paths and update orphaned media records
        if (mediaUrls.length > 0) {
          const storagePaths = mediaUrls
            .filter(url => url.startsWith('/images/services/') || url.startsWith('/videos/services/'))
            .map(url => `public${url}`);

          if (storagePaths.length > 0) {
            await prisma.storageMedia.updateMany({
              where: {
                path: { in: storagePaths },
                parentId: null,
                parentType: 'service-text-editor'
              },
              data: {
                parentId: id
              }
            });
          }
        }
      } catch (mediaError) {
        console.error('Error associating media files:', mediaError);
        // Don't fail the service update if media association fails
      }
    }

    // Parse JSON fields for response
    const service = {
      ...serviceRaw,
      benefits: serviceRaw.benefits ? JSON.parse(serviceRaw.benefits) : null,
      implementationProcess: serviceRaw.implementationProcess ? JSON.parse(serviceRaw.implementationProcess) : null,
    };

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    // Check if service exists and get its data
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Get all StorageMedia records associated with this service
    const storageMediaRecords = await prisma.storageMedia.findMany({
      where: {
        parentType: 'service-text-editor',
        parentId: id
      }
    });

    // Delete the main service image file if it exists (before deleting from DB)
    if (existingService.image) {
      await deleteImageFile(existingService.image);
    }

    // Delete all StorageMedia files from storage (before deleting from DB)
    if (storageMediaRecords.length > 0) {
      for (const record of storageMediaRecords) {
        if (record.path) {
          // Convert storage path to public URL format
          // path is stored as "public/images/..." or "public/videos/..." so we need to extract "/images/..." or "/videos/..."
          const publicUrl = record.path.replace(/^public/, '');
          await deleteImageFile(publicUrl);
        }
      }

      // Delete all StorageMedia records from database
      await prisma.storageMedia.deleteMany({
        where: {
          parentType: 'service-text-editor',
          parentId: id
        }
      });
    }

    // Finally, delete service from database
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
