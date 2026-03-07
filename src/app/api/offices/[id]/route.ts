import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/offices/[id] - Get a single office
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid office ID" },
        { status: 400 }
      );
    }

    const office = await prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      return NextResponse.json(
        { error: "Office not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(office);
  } catch (error) {
    console.error("Error fetching office:", error);
    return NextResponse.json(
      { error: "Failed to fetch office" },
      { status: 500 }
    );
  }
}

// PUT /api/offices/[id] - Update an office
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid office ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      phone,
      email,
      address,
      workingTime,
      googleMapEmbedUrl,
      isMainOffice,
    } = body;

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // If this is being set as main office, unset any existing main office
    if (isMainOffice) {
      await prisma.office.updateMany({
        where: { 
          isMainOffice: true,
          id: { not: id }
        },
        data: { isMainOffice: false },
      });
    }

    const office = await prisma.office.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(workingTime !== undefined && { workingTime }),
        ...(googleMapEmbedUrl !== undefined && { googleMapEmbedUrl }),
        ...(isMainOffice !== undefined && { isMainOffice }),
      },
    });

    return NextResponse.json(office);
  } catch (error) {
    console.error("Error updating office:", error);
    return NextResponse.json(
      { error: "Failed to update office" },
      { status: 500 }
    );
  }
}

// DELETE /api/offices/[id] - Delete an office
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid office ID" },
        { status: 400 }
      );
    }

    await prisma.office.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Office deleted successfully" });
  } catch (error) {
    console.error("Error deleting office:", error);
    return NextResponse.json(
      { error: "Failed to delete office" },
      { status: 500 }
    );
  }
}
