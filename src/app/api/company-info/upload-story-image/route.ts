import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORY_IMAGE_PATH = path.join(process.cwd(), "public", "images", "our_story.webp");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

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

    // Validate file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File size exceeds 10MB limit",
          message: `Maximum file size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
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

    // Delete old story image if it exists
    if (existsSync(STORY_IMAGE_PATH)) {
      try {
        await unlink(STORY_IMAGE_PATH);
      } catch (error) {
        console.error("Error deleting old story image:", error);
      }
    }

    // Convert and optimize image to WebP format
    await sharp(buffer)
      .resize(1920, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(STORY_IMAGE_PATH);

    return NextResponse.json({
      success: true,
      imageUrl: "/images/our_story.webp",
      message: "Story image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading story image:", error);
    return NextResponse.json(
      {
        error: "Failed to upload story image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
