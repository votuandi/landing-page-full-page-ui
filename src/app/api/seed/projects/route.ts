import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/seed/projects - Seed the database with 20 sample projects
export async function POST() {
  try {
    const projects = [
      {
        title: 'Hệ thống điện mặt trời 50kW - Nhà máy Dệt May Hòa Thọ',
        location: 'Quận 12, TP. Hồ Chí Minh',
        capacity: '50 kWp',
        completedDate: '12/2023',
        imageUrl: '/images/projects/project-1.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời áp mái công suất 50kW cho nhà máy dệt may, giúp tiết kiệm 60% chi phí điện hàng tháng.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời áp mái công suất 50kW tại nhà máy dệt may Hòa Thọ, giúp doanh nghiệp tiết kiệm đáng kể chi phí điện năng.</p><h3>Thông số kỹ thuật</h3><ul><li>Tổng công suất: 50 kWp</li><li>Số lượng tấm pin: 125 tấm (400W/tấm)</li><li>Biến tần: 50kW 3 pha</li><li>Sản lượng điện ước tính: 6,500 kWh/tháng</li></ul>',
        category: 'Công nghiệp',
        client: 'Công ty TNHH Dệt May Hòa Thọ',
        isDisplay: true,
        showInHomepage: true,
        order: 1,
      },
      {
        title: 'Hệ thống điện mặt trời 10kW - Biệt thự Phú Mỹ Hưng',
        location: 'Quận 7, TP. Hồ Chí Minh',
        capacity: '10 kWp',
        completedDate: '11/2023',
        imageUrl: '/images/projects/project-2.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho biệt thự cao cấp, giảm 80% hóa đơn tiền điện hàng tháng.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời cho biệt thự tại khu đô thị Phú Mỹ Hưng, mang lại giải pháp năng lượng xanh và tiết kiệm cho gia đình.</p><h3>Đặc điểm nổi bật</h3><ul><li>Thiết kế thẩm mỹ, hài hòa với kiến trúc</li><li>Hệ thống giám sát thông minh</li><li>Tích hợp pin lưu trữ 10kWh</li><li>Tiết kiệm 80% hóa đơn điện</li></ul>',
        category: 'Dân dụng',
        client: 'Gia đình anh Nguyễn Văn A',
        isDisplay: true,
        showInHomepage: true,
        order: 2,
      },
      {
        title: 'Hệ thống điện mặt trời 100kW - Trung tâm thương mại Vincom',
        location: 'Quận 1, TP. Hồ Chí Minh',
        capacity: '100 kWp',
        completedDate: '10/2023',
        imageUrl: '/images/projects/project-3.jpg',
        description: 'Dự án quy mô lớn cho trung tâm thương mại, công suất 100kW, tiết kiệm 5 tỷ đồng/năm.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời quy mô lớn cho trung tâm thương mại Vincom, đáp ứng nhu cầu điện năng cao và giảm thiểu chi phí vận hành.</p><h3>Quy mô dự án</h3><ul><li>Tổng công suất: 100 kWp</li><li>Diện tích lắp đặt: 800m²</li><li>Sản lượng điện: 13,000 kWh/tháng</li><li>Tiết kiệm: 5 tỷ đồng/năm</li></ul>',
        category: 'Thương mại',
        client: 'Tập đoàn Vincom',
        isDisplay: true,
        showInHomepage: true,
        order: 3,
      },
      {
        title: 'Hệ thống điện mặt trời 30kW - Trường THPT Lê Quý Đôn',
        location: 'Quận Tân Bình, TP. Hồ Chí Minh',
        capacity: '30 kWp',
        completedDate: '09/2023',
        imageUrl: '/images/projects/project-4.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho trường học, góp phần giáo dục ý thức bảo vệ môi trường.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời tại trường THPT Lê Quý Đôn, không chỉ giúp tiết kiệm chi phí mà còn là công cụ giáo dục về năng lượng tái tạo.</p><h3>Lợi ích</h3><ul><li>Tiết kiệm 3,900 kWh/tháng</li><li>Giảm 40 tấn CO2/năm</li><li>Công cụ giáo dục thực tế</li><li>Nâng cao nhận thức môi trường</li></ul>',
        category: 'Giáo dục',
        client: 'Trường THPT Lê Quý Đôn',
        isDisplay: true,
        showInHomepage: false,
        order: 4,
      },
      {
        title: 'Hệ thống điện mặt trời 75kW - Khách sạn Mường Thanh',
        location: 'Đà Nẵng',
        capacity: '75 kWp',
        completedDate: '08/2023',
        imageUrl: '/images/projects/project-5.jpg',
        description: 'Giải pháp năng lượng xanh cho khách sạn 4 sao, công suất 75kW, tiết kiệm 70% chi phí điện.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời cho khách sạn Mường Thanh Đà Nẵng, mang lại giải pháp năng lượng bền vững và nâng cao hình ảnh thương hiệu xanh.</p><h3>Hiệu quả</h3><ul><li>Công suất: 75 kWp</li><li>Sản lượng: 9,750 kWh/tháng</li><li>Tiết kiệm: 70% chi phí điện</li><li>Thời gian hoàn vốn: 5 năm</li></ul>',
        category: 'Du lịch',
        client: 'Khách sạn Mường Thanh',
        isDisplay: true,
        showInHomepage: false,
        order: 5,
      },
      {
        title: 'Hệ thống điện mặt trời 40kW - Nhà máy chế biến thực phẩm',
        location: 'Bình Dương',
        capacity: '40 kWp',
        completedDate: '07/2023',
        imageUrl: '/images/projects/project-6.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho nhà máy chế biến thực phẩm, đảm bảo nguồn điện ổn định.',
        detail: '<p>Dự án cung cấp giải pháp năng lượng mặt trời cho nhà máy chế biến thực phẩm, đáp ứng nhu cầu điện năng cao và ổn định cho dây chuyền sản xuất.</p>',
        category: 'Công nghiệp',
        client: 'Công ty CP Thực phẩm Sạch',
        isDisplay: true,
        showInHomepage: false,
        order: 6,
      },
      {
        title: 'Hệ thống điện mặt trời 8kW - Nhà phố Thủ Đức',
        location: 'TP. Thủ Đức, TP. Hồ Chí Minh',
        capacity: '8 kWp',
        completedDate: '06/2023',
        imageUrl: '/images/projects/project-7.jpg',
        description: 'Giải pháp điện mặt trời cho nhà phố, tiết kiệm chi phí và thân thiện môi trường.',
        detail: '<p>Lắp đặt hệ thống điện mặt trời 8kW cho nhà phố tại Thủ Đức, giúp gia đình tiết kiệm chi phí điện và góp phần bảo vệ môi trường.</p>',
        category: 'Dân dụng',
        client: 'Gia đình chị Trần Thị B',
        isDisplay: true,
        showInHomepage: false,
        order: 7,
      },
      {
        title: 'Hệ thống điện mặt trời 120kW - Siêu thị Co.opMart',
        location: 'Cần Thơ',
        capacity: '120 kWp',
        completedDate: '05/2023',
        imageUrl: '/images/projects/project-8.jpg',
        description: 'Dự án quy mô lớn cho hệ thống siêu thị, công suất 120kW, giảm 65% chi phí điện.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời công suất 120kW cho siêu thị Co.opMart Cần Thơ, mang lại hiệu quả kinh tế cao và nâng cao hình ảnh doanh nghiệp xanh.</p>',
        category: 'Thương mại',
        client: 'Siêu thị Co.opMart',
        isDisplay: true,
        showInHomepage: false,
        order: 8,
      },
      {
        title: 'Hệ thống điện mặt trời 25kW - Trường Mầm non Hoa Mai',
        location: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
        capacity: '25 kWp',
        completedDate: '04/2023',
        imageUrl: '/images/projects/project-9.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho trường mầm non, an toàn và hiệu quả.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời cho trường mầm non Hoa Mai, đảm bảo an toàn tuyệt đối và tiết kiệm chi phí vận hành.</p>',
        category: 'Giáo dục',
        client: 'Trường Mầm non Hoa Mai',
        isDisplay: true,
        showInHomepage: false,
        order: 9,
      },
      {
        title: 'Hệ thống điện mặt trời 60kW - Resort Phú Quốc',
        location: 'Phú Quốc, Kiên Giang',
        capacity: '60 kWp',
        completedDate: '03/2023',
        imageUrl: '/images/projects/project-10.jpg',
        description: 'Giải pháp năng lượng xanh cho resort cao cấp, công suất 60kW.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời cho resort tại Phú Quốc, kết hợp giữa tiết kiệm năng lượng và bảo vệ cảnh quan thiên nhiên.</p>',
        category: 'Du lịch',
        client: 'Resort Paradise Phú Quốc',
        isDisplay: true,
        showInHomepage: false,
        order: 10,
      },
      {
        title: 'Hệ thống điện mặt trời 90kW - Nhà máy may mặc Việt Tiến',
        location: 'Đồng Nai',
        capacity: '90 kWp',
        completedDate: '02/2023',
        imageUrl: '/images/projects/project-11.jpg',
        description: 'Hệ thống điện mặt trời quy mô lớn cho nhà máy may mặc, tiết kiệm 11,700 kWh/tháng.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời 90kW cho nhà máy may mặc Việt Tiến, giúp doanh nghiệp giảm thiểu chi phí sản xuất và nâng cao năng lực cạnh tranh.</p>',
        category: 'Công nghiệp',
        client: 'Công ty CP May Việt Tiến',
        isDisplay: true,
        showInHomepage: false,
        order: 11,
      },
      {
        title: 'Hệ thống điện mặt trời 12kW - Villa Đà Lạt',
        location: 'Đà Lạt, Lâm Đồng',
        capacity: '12 kWp',
        completedDate: '01/2023',
        imageUrl: '/images/projects/project-12.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho villa nghỉ dưỡng tại Đà Lạt.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời 12kW cho villa tại Đà Lạt, phù hợp với khí hậu mát mẻ và đảm bảo cung cấp điện ổn định quanh năm.</p>',
        category: 'Dân dụng',
        client: 'Gia đình ông Lê Văn C',
        isDisplay: true,
        showInHomepage: false,
        order: 12,
      },
      {
        title: 'Hệ thống điện mặt trời 150kW - Trung tâm logistics',
        location: 'Long An',
        capacity: '150 kWp',
        completedDate: '12/2022',
        imageUrl: '/images/projects/project-13.jpg',
        description: 'Dự án điện mặt trời quy mô lớn nhất cho trung tâm logistics, công suất 150kW.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời công suất 150kW cho trung tâm logistics, đáp ứng nhu cầu điện năng lớn và giảm chi phí vận hành đáng kể.</p>',
        category: 'Thương mại',
        client: 'Công ty TNHH Logistics Việt Nam',
        isDisplay: true,
        showInHomepage: false,
        order: 13,
      },
      {
        title: 'Hệ thống điện mặt trời 35kW - Trường Đại học Bách Khoa',
        location: 'Quận Thủ Đức, TP. Hồ Chí Minh',
        capacity: '35 kWp',
        completedDate: '11/2022',
        imageUrl: '/images/projects/project-14.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho trường đại học, phục vụ nghiên cứu và giảng dạy.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời tại Trường Đại học Bách Khoa, không chỉ tiết kiệm năng lượng mà còn là mô hình thực hành cho sinh viên.</p>',
        category: 'Giáo dục',
        client: 'Trường ĐH Bách Khoa TP.HCM',
        isDisplay: true,
        showInHomepage: false,
        order: 14,
      },
      {
        title: 'Hệ thống điện mặt trời 45kW - Khách sạn Sài Gòn',
        location: 'Quận 1, TP. Hồ Chí Minh',
        capacity: '45 kWp',
        completedDate: '10/2022',
        imageUrl: '/images/projects/project-15.jpg',
        description: 'Giải pháp năng lượng xanh cho khách sạn trung tâm thành phố.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời 45kW cho khách sạn Sài Gòn, giúp khách sạn tiết kiệm chi phí và nâng cao hình ảnh thương hiệu xanh.</p>',
        category: 'Du lịch',
        client: 'Khách sạn Sài Gòn',
        isDisplay: true,
        showInHomepage: false,
        order: 15,
      },
      {
        title: 'Hệ thống điện mặt trời 70kW - Nhà máy sản xuất đồ gỗ',
        location: 'Bình Dương',
        capacity: '70 kWp',
        completedDate: '09/2022',
        imageUrl: '/images/projects/project-16.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho nhà máy sản xuất đồ gỗ xuất khẩu.',
        detail: '<p>Dự án cung cấp giải pháp năng lượng mặt trời cho nhà máy sản xuất đồ gỗ, giúp doanh nghiệp đáp ứng tiêu chuẩn xanh của thị trường xuất khẩu.</p>',
        category: 'Công nghiệp',
        client: 'Công ty TNHH Gỗ Xuất Khẩu',
        isDisplay: true,
        showInHomepage: false,
        order: 16,
      },
      {
        title: 'Hệ thống điện mặt trời 15kW - Nhà vườn Củ Chi',
        location: 'Củ Chi, TP. Hồ Chí Minh',
        capacity: '15 kWp',
        completedDate: '08/2022',
        imageUrl: '/images/projects/project-17.jpg',
        description: 'Giải pháp điện mặt trời cho nhà vườn, kết hợp với nông nghiệp công nghệ cao.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời cho nhà vườn tại Củ Chi, cung cấp điện cho hệ thống tưới tiêu tự động và sinh hoạt.</p>',
        category: 'Dân dụng',
        client: 'Trang trại Xanh Củ Chi',
        isDisplay: true,
        showInHomepage: false,
        order: 17,
      },
      {
        title: 'Hệ thống điện mặt trời 110kW - Nhà hàng tiệc cưới',
        location: 'Quận 9, TP. Hồ Chí Minh',
        capacity: '110 kWp',
        completedDate: '07/2022',
        imageUrl: '/images/projects/project-18.jpg',
        description: 'Hệ thống điện mặt trời cho trung tâm tiệc cưới, đáp ứng nhu cầu điện lớn.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời 110kW cho trung tâm tiệc cưới, đảm bảo cung cấp điện ổn định cho hệ thống điều hòa, ánh sáng và âm thanh.</p>',
        category: 'Thương mại',
        client: 'Trung tâm tiệc cưới Riverside',
        isDisplay: true,
        showInHomepage: false,
        order: 18,
      },
      {
        title: 'Hệ thống điện mặt trời 28kW - Trường THCS Nguyễn Du',
        location: 'Quận 10, TP. Hồ Chí Minh',
        capacity: '28 kWp',
        completedDate: '06/2022',
        imageUrl: '/images/projects/project-19.jpg',
        description: 'Lắp đặt hệ thống điện mặt trời cho trường trung học cơ sở.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời tại trường THCS Nguyễn Du, góp phần giảm chi phí vận hành và giáo dục ý thức bảo vệ môi trường cho học sinh.</p>',
        category: 'Giáo dục',
        client: 'Trường THCS Nguyễn Du',
        isDisplay: true,
        showInHomepage: false,
        order: 19,
      },
      {
        title: 'Hệ thống điện mặt trời 55kW - Homestay Vũng Tàu',
        location: 'Vũng Tàu, Bà Rịa - Vũng Tàu',
        capacity: '55 kWp',
        completedDate: '05/2022',
        imageUrl: '/images/projects/project-20.jpg',
        description: 'Giải pháp năng lượng xanh cho chuỗi homestay ven biển.',
        detail: '<p>Dự án lắp đặt hệ thống điện mặt trời 55kW cho chuỗi homestay tại Vũng Tàu, mang lại giải pháp năng lượng bền vững và thu hút khách du lịch yêu thích môi trường.</p>',
        category: 'Du lịch',
        client: 'Chuỗi Homestay Seaside',
        isDisplay: true,
        showInHomepage: false,
        order: 20,
      },
    ]

    // Create projects
    let createdCount = 0
    for (const project of projects) {
      try {
        await prisma.project.create({
          data: project,
        })
        createdCount++
        console.log(`Created project: ${project.title}`)
      } catch (error) {
        console.error(`Failed to create project: ${project.title}`, error)
      }
    }

    return NextResponse.json(
      { 
        message: `Successfully seeded ${createdCount} out of ${projects.length} projects`,
        created: createdCount,
        total: projects.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error seeding projects:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed projects', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET /api/seed/projects - Check seeding status
export async function GET() {
  try {
    const count = await prisma.project.count()
    return NextResponse.json(
      { 
        message: 'Project seeding endpoint',
        currentProjectCount: count,
        info: 'Use POST method to seed 20 projects'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check project count' },
      { status: 500 }
    )
  }
}
