import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Create a new PrismaClient instance for seeding
// DATABASE_URL should be available from environment variables (set in docker-compose.yml)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/landing_page_db?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

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

  console.log(`Created ${banners.length} sample banners`)
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
