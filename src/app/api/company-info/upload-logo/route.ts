import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo.png");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File size exceeds 5MB limit",
          message: `Maximum file size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), "public", "images");
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // Delete old logo file if it exists
    if (existsSync(LOGO_PATH)) {
      try {
        await unlink(LOGO_PATH);
      } catch (error) {
        console.error("Error deleting old logo:", error);
      }
    }

    // Write new logo file
    await writeFile(LOGO_PATH, buffer);

    return NextResponse.json({
      success: true,
      logoUrl: "/images/logo.png",
      message: "Logo uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      {
        error: "Failed to upload logo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
