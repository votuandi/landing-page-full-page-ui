import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/contact-form/count - Get count of unresolved contact forms
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isResolved = searchParams.get("isResolved");

    // Build where clause
    const where: any = {};

    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === "true";
    }

    // Get count
    const count = await prisma.contactForm.count({ where });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Error counting contact forms:", error);
    return NextResponse.json(
      { error: "Failed to count contact forms" },
      { status: 500 }
    );
  }
}
