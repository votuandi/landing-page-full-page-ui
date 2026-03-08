import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch company info (singleton pattern - only one record with id=1)
export async function GET() {
  try {
    // Get the singleton company info record (id=1)
    let companyInfo = await prisma.companyInfo.findUnique({
      where: { id: 1 },
    });

    // If no company info exists, create the singleton record
    if (!companyInfo) {
      companyInfo = await prisma.companyInfo.create({
        data: {
          id: 1, // Explicitly set id to 1 for singleton pattern
          companyName: "Tên công ty",
          slogan: "Slogan công ty",
          storyTitle: "Hành trình phát triển",
          storyDetail: "Chi tiết hành trình phát triển",
          storyItems: [
            { title: "Mục tiêu 1", detail: "Chi tiết mục tiêu 1" },
            { title: "Mục tiêu 2", detail: "Chi tiết mục tiêu 2" },
            { title: "Mục tiêu 3", detail: "Chi tiết mục tiêu 3" },
            { title: "Mục tiêu 4", detail: "Chi tiết mục tiêu 4" },
          ],
          milestones: [
            { time: "2020", title: "Thành lập", detail: "Công ty được thành lập" },
          ],
          coreValues: [
            { title: "Giá trị 1", detail: "Mô tả giá trị 1" },
            { title: "Giá trị 2", detail: "Mô tả giá trị 2" },
            { title: "Giá trị 3", detail: "Mô tả giá trị 3" },
            { title: "Giá trị 4", detail: "Mô tả giá trị 4" },
          ],
          mission: "Sứ mệnh của công ty",
          achievements: [
            { title: "Thành tựu 1", detail: "Mô tả thành tựu 1" },
          ],
          team: [
            { amount: "50+", title: "Nhân viên", detail: "Đội ngũ chuyên nghiệp" },
          ],
          whyChooseUs: [
            { title: "Tại sao chọn chúng tôi", detail: "Lý do bạn nên chọn chúng tôi" },
          ],
        },
      });
    }

    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error("Error fetching company info:", error);
    return NextResponse.json(
      { error: "Failed to fetch company info" },
      { status: 500 }
    );
  }
}

// PUT - Update company info (singleton pattern - only updates id=1)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Always use id=1 for singleton pattern
    const companyInfo = await prisma.companyInfo.upsert({
      where: { id: 1 },
      update: body,
      create: {
        id: 1,
        ...body,
      },
    });

    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error("Error updating company info:", error);
    return NextResponse.json(
      { error: "Failed to update company info" },
      { status: 500 }
    );
  }
}

// POST - Create/Update company info (same as PUT for singleton pattern)
export async function POST(request: NextRequest) {
  return PUT(request);
}
