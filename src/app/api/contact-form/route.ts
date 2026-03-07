import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/contact-form - Get all contact form submissions with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const isResolved = searchParams.get("isResolved");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { consultationType: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === "true";
    }

    // Get total count
    const total = await prisma.contactForm.count({ where });

    // Get contact form submissions
    const contactForms = await prisma.contactForm.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      contactForms,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact forms" },
      { status: 500 }
    );
  }
}

// POST /api/contact-form - Create a new contact form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      consultationType,
      specificItem,
      details,
    } = body;

    // Validate required fields
    if (!name || !phone || !email || !consultationType) {
      return NextResponse.json(
        { error: "Name, phone, email, and consultation type are required" },
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

    // Validate phone format (basic validation for Vietnamese phone numbers)
    const phoneRegex = /^[0-9]{10,11}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const contactForm = await prisma.contactForm.create({
      data: {
        name,
        phone,
        email,
        consultationType,
        specificItem: specificItem || null,
        details: details || null,
        isResolved: false, // Default value
      },
    });

    return NextResponse.json(contactForm, { status: 201 });
  } catch (error) {
    console.error("Error creating contact form:", error);
    return NextResponse.json(
      { error: "Failed to create contact form submission" },
      { status: 500 }
    );
  }
}
