import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services - Get all services with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    // Get total count
    const total = await prisma.service.count({ where });

    // Get services
    const servicesRaw = await prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Parse JSON fields
    const services = servicesRaw.map(service => ({
      ...service,
      benefits: service.benefits ? JSON.parse(service.benefits) : null,
      implementationProcess: service.implementationProcess ? JSON.parse(service.implementationProcess) : null,
    }));

    return NextResponse.json({
      services,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
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

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const serviceRaw = await prisma.service.create({
      data: {
        title,
        description: description || null,
        image: image || null,
        features: features || [],
        price: price || null,
        category: category || "household",
        duration: duration || null,
        warranty: warranty || null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        implementationProcess: implementationProcess ? JSON.stringify(implementationProcess) : null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });

    // Update StorageMedia records with the new service ID
    // Extract media URLs from description content and associate them with this service
    if (description) {
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
                parentId: serviceRaw.id
              }
            });
          }
        }
      } catch (mediaError) {
        console.error('Error associating media files:', mediaError);
        // Don't fail the service creation if media association fails
      }
    }

    // Parse JSON fields for response
    const service = {
      ...serviceRaw,
      benefits: serviceRaw.benefits ? JSON.parse(serviceRaw.benefits) : null,
      implementationProcess: serviceRaw.implementationProcess ? JSON.parse(serviceRaw.implementationProcess) : null,
    };

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
