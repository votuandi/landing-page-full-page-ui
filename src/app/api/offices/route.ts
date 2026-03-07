import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/offices - Get all offices with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.office.count({ where });

    // Get offices
    const offices = await prisma.office.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isMainOffice: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      offices,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching offices:", error);
    return NextResponse.json(
      { error: "Failed to fetch offices" },
      { status: 500 }
    );
  }
}

// POST /api/offices - Create a new office
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!name || !phone || !email || !address || !workingTime) {
      return NextResponse.json(
        { error: "Name, phone, email, address, and working time are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // If this is being set as main office, unset any existing main office
    if (isMainOffice) {
      await prisma.office.updateMany({
        where: { isMainOffice: true },
        data: { isMainOffice: false },
      });
    }

    const office = await prisma.office.create({
      data: {
        name,
        phone,
        email,
        address,
        workingTime,
        googleMapEmbedUrl: googleMapEmbedUrl || null,
        isMainOffice: isMainOffice || false,
      },
    });

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    console.error("Error creating office:", error);
    return NextResponse.json(
      { error: "Failed to create office" },
      { status: 500 }
    );
  }
}
