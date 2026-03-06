import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
const VIDEO_DIR = path.join(process.cwd(), "public", "videos");
const VIDEO_PATH = path.join(VIDEO_DIR, "hero_video.mp4");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: "File size exceeds maximum limit",
          message: `Maximum file size is 500MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure videos directory exists
    if (!existsSync(VIDEO_DIR)) {
      await mkdir(VIDEO_DIR, { recursive: true });
    }

    // Delete old video file if it exists
    if (existsSync(VIDEO_PATH)) {
      try {
        await unlink(VIDEO_PATH);
      } catch (error) {
        console.error("Error deleting old video file:", error);
        // Continue even if deletion fails
      }
    }

    // Write new video file
    await writeFile(VIDEO_PATH, buffer);

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      videoUrl: "/videos/hero_video.mp4",
      fileSize: file.size,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Failed to upload video", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
