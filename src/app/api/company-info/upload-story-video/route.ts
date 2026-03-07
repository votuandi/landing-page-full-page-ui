import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const VIDEO_DIR = path.join(process.cwd(), "public", "images");

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

    // Validate file size (max 1GB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File size exceeds maximum limit",
          message: `Maximum file size is 1GB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Get file extension from original filename
    const originalName = file.name;
    const extension = originalName.substring(originalName.lastIndexOf("."));

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure images directory exists
    if (!existsSync(VIDEO_DIR)) {
      await mkdir(VIDEO_DIR, { recursive: true });
    }

    // Delete old story video files if they exist (any extension)
    try {
      const files = await readdir(VIDEO_DIR);
      const storyVideoFiles = files.filter((f) =>
        f.startsWith("our_story.") && f !== "our_story.webp"
      );
      for (const oldFile of storyVideoFiles) {
        const oldPath = path.join(VIDEO_DIR, oldFile);
        await unlink(oldPath);
      }
    } catch (error) {
      console.error("Error deleting old story video:", error);
    }

    // Write new video file with original extension
    const videoPath = path.join(VIDEO_DIR, `our_story${extension}`);
    await writeFile(videoPath, buffer);

    return NextResponse.json({
      success: true,
      videoUrl: `/images/our_story${extension}`,
      message: "Story video uploaded successfully",
      fileSize: file.size,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading story video:", error);
    return NextResponse.json(
      {
        error: "Failed to upload story video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
