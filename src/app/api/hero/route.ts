import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch hero content
export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set");
      return NextResponse.json(
        {
          error: "Database configuration error",
          message:
            "DATABASE_URL environment variable is not set. Please check your .env file.",
          hint: "Make sure you have a .env file with DATABASE_URL configured.",
        },
        { status: 500 }
      );
    }

    // Get the first (and should be only) hero content record
    let heroContent = await prisma.heroContent.findFirst();

    // If no hero content exists, create default content
    if (!heroContent) {
      heroContent = await prisma.heroContent.create({
        data: {
          title: "Giải pháp Năng lượng Mặt trời hàng đầu",
          description:
            "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin solar, biến tần inverter, pin lưu trữ và giải pháp năng lượng tái tạo toàn diện.",
          videoUrl: "/videos/hero_video.mp4",
          stat1Value: "10+",
          stat1Label: "Năm kinh nghiệm",
          stat2Value: "1000+",
          stat2Label: "Dự án hoàn thành",
          stat3Value: "24/7",
          stat3Label: "Hỗ trợ kỹ thuật",
          feature1Title: "Thân thiện",
          feature1Description: "Thân thiện môi trường",
          feature2Title: "Tiết kiệm điện",
          feature2Description: "Lên đến 90%",
        },
      });
    }

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error("Error fetching hero content:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero content" },
      { status: 500 }
    );
  }
}

// POST - Update hero content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      videoUrl,
      stat1Value,
      stat1Label,
      stat2Value,
      stat2Label,
      stat3Value,
      stat3Label,
      feature1Title,
      feature1Description,
      feature2Title,
      feature2Description,
    } = body;

    // Validate required fields
    if (!title || !description || !videoUrl) {
      return NextResponse.json(
        { error: "Title, description, and videoUrl are required" },
        { status: 400 }
      );
    }

    // Check if hero content exists
    const existingHeroContent = await prisma.heroContent.findFirst();

    let heroContent;
    if (existingHeroContent) {
      // Update existing hero content
      heroContent = await prisma.heroContent.update({
        where: { id: existingHeroContent.id },
        data: {
          title,
          description,
          videoUrl,
          stat1Value,
          stat1Label,
          stat2Value,
          stat2Label,
          stat3Value,
          stat3Label,
          feature1Title,
          feature1Description,
          feature2Title,
          feature2Description,
        },
      });
    } else {
      // Create new hero content
      heroContent = await prisma.heroContent.create({
        data: {
          title,
          description,
          videoUrl,
          stat1Value,
          stat1Label,
          stat2Value,
          stat2Label,
          stat3Value,
          stat3Label,
          feature1Title,
          feature1Description,
          feature2Title,
          feature2Description,
        },
      });
    }

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error("Error updating hero content:", error);
    return NextResponse.json(
      { error: "Failed to update hero content" },
      { status: 500 }
    );
  }
}
