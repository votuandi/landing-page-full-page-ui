import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/seed - Seed the database with sample banners
export async function POST() {
  try {
    // Clear existing banners
    await prisma.banner.deleteMany()
    console.log('Cleared existing banners')

    // Create sample banners
    const banners = [
      {
        title: 'GIẢM GIÁ ĐẶC BIỆT',
        subtitle: 'Tấm pin năng lượng mặt trời',
        description:
          'Giảm ngay 20% cho đơn hàng đầu tiên. Chất lượng cao, hiệu suất vượt trội, bảo hành 25 năm.',
        buttonText: 'Xem ngay',
        buttonLink: '/solar-panels',
        backgroundImage: '/images/solar-panels-hero.jpg',
        backgroundColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
        isActive: true,
        order: 0,
      },
      {
        title: 'CÔNG NGHỆ TIÊN TIẾN',
        subtitle: 'Biến tần Inverter thông minh',
        description:
          'Hiệu suất chuyển đổi 97%, giám sát từ xa, tương thích với mọi hệ thống solar.',
        buttonText: 'Tìm hiểu thêm',
        buttonLink: '/inverter',
        backgroundImage: '/images/solar-inverter-hero.jpg',
        backgroundColor: 'bg-gradient-to-r from-pink-500 to-red-500',
        isActive: true,
        order: 1,
      },
      {
        title: 'GIẢI PHÁP HOÀN CHỈNH',
        subtitle: 'Hệ thống năng lượng mặt trời',
        description:
          'Tư vấn miễn phí, lắp đặt chuyên nghiệp, bảo hành toàn diện. Tiết kiệm 70% hóa đơn điện.',
        buttonText: 'Liên hệ ngay',
        buttonLink: '/contact',
        backgroundImage: '/images/solar-installation-hero.jpg',
        backgroundColor: 'bg-gradient-to-r from-teal-400 to-pink-300',
        isActive: true,
        order: 2,
      },
      {
        title: 'ƯU ĐÃI HẤP DẪN',
        subtitle: 'Pin lưu trữ năng lượng',
        description:
          'Mua ngay hôm nay - Nhận ưu đãi lên đến 15%. Dung lượng lớn, sạc nhanh, an toàn tuyệt đối.',
        buttonText: 'Khám phá',
        buttonLink: '/batteries',
        backgroundImage: '/images/solar-battery-hero.jpg',
        backgroundColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        isActive: true,
        order: 3,
      },
    ]

    for (const banner of banners) {
      await prisma.banner.create({
        data: banner,
      })
    }

    return NextResponse.json(
      { message: `Successfully seeded ${banners.length} banners` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
