import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/contact-form/[id] - Get a single contact form submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid contact form ID" },
        { status: 400 }
      );
    }

    const contactForm = await prisma.contactForm.findUnique({
      where: { id },
    });

    if (!contactForm) {
      return NextResponse.json(
        { error: "Contact form submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contactForm);
  } catch (error) {
    console.error("Error fetching contact form:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact form submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/contact-form/[id] - Update a contact form submission (e.g., mark as resolved)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid contact form ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isResolved } = body;

    // Check if contact form exists
    const existingContactForm = await prisma.contactForm.findUnique({
      where: { id },
    });

    if (!existingContactForm) {
      return NextResponse.json(
        { error: "Contact form submission not found" },
        { status: 404 }
      );
    }

    // Update the contact form
    const updatedContactForm = await prisma.contactForm.update({
      where: { id },
      data: {
        isResolved: isResolved !== undefined ? isResolved : existingContactForm.isResolved,
      },
    });

    return NextResponse.json(updatedContactForm);
  } catch (error) {
    console.error("Error updating contact form:", error);
    return NextResponse.json(
      { error: "Failed to update contact form submission" },
      { status: 500 }
    );
  }
}

// DELETE /api/contact-form/[id] - Delete a contact form submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid contact form ID" },
        { status: 400 }
      );
    }

    // Check if contact form exists
    const existingContactForm = await prisma.contactForm.findUnique({
      where: { id },
    });

    if (!existingContactForm) {
      return NextResponse.json(
        { error: "Contact form submission not found" },
        { status: 404 }
      );
    }

    await prisma.contactForm.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Contact form submission deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting contact form:", error);
    return NextResponse.json(
      { error: "Failed to delete contact form submission" },
      { status: 500 }
    );
  }
}
