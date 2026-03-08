import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.news.deleteMany({});
  console.log('✅ Cleared existing news data');

  await prisma.project.deleteMany({});
  console.log('✅ Cleared existing project data');

  await prisma.service.deleteMany({});
  console.log('✅ Cleared existing service data');

  // Seed projects based on ProjectsSection.tsx
  const projects = [
    {
      title: 'Hệ thống điện mặt trời nhà máy ABC',
      location: 'Bình Dương',
      capacity: '500kW',
      completedDate: 'Tháng 12, 2023',
      imageUrl: '/images/news-1.jpg',
      description: 'Hệ thống điện mặt trời quy mô lớn cho nhà máy sản xuất, giúp tiết kiệm 70% chi phí điện năng hàng năm.',
      detail: `
<h2>Tổng quan dự án</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời áp mái cho nhà máy sản xuất ABC tại Bình Dương là một trong những dự án tiêu biểu của chúng tôi trong lĩnh vực công nghiệp.</p>

<h3>Thông số kỹ thuật</h3>
<ul>
<li>Tổng công suất: 500kWp</li>
<li>Số lượng tấm pin: 1,250 tấm (400W/tấm)</li>
<li>Loại tấm pin: Mono PERC hiệu suất cao</li>
<li>Inverter: 3 x 150kW + 1 x 50kW</li>
<li>Diện tích lắp đặt: 3,500m²</li>
</ul>

<h3>Hiệu quả kinh tế</h3>
<p>Hệ thống giúp nhà máy tiết kiệm 70% chi phí điện năng hàng năm, tương đương khoảng 1.2 tỷ đồng. Thời gian hoàn vốn dự kiến: 5-6 năm.</p>

<h3>Lợi ích môi trường</h3>
<p>Giảm phát thải CO2: 450 tấn/năm, tương đương việc trồng 20,000 cây xanh.</p>
      `,
      category: 'Công nghiệp',
      client: 'Công ty ABC Manufacturing',
      isDisplay: true,
      showInHomepage: true,
      order: 1,
    },
    {
      title: 'Điện mặt trời áp mái biệt thự',
      location: 'TP. Hồ Chí Minh',
      capacity: '15kW',
      completedDate: 'Tháng 11, 2023',
      imageUrl: '/images/news-2.jpg',
      description: 'Hệ thống điện mặt trời áp mái cho biệt thự, tích hợp pin lưu trữ và hệ thống smart home.',
      detail: `
<h2>Giải pháp năng lượng thông minh cho gia đình</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời kết hợp pin lưu trữ và smart home cho biệt thự tại Quận 7, TP.HCM.</p>

<h3>Cấu hình hệ thống</h3>
<ul>
<li>Công suất tấm pin: 15kWp</li>
<li>Pin lưu trữ: 20kWh LiFePO4</li>
<li>Inverter hybrid: 15kW</li>
<li>Hệ thống giám sát: App di động + Web</li>
<li>Tích hợp smart home: Điều khiển tự động theo sản lượng điện</li>
</ul>

<h3>Đặc điểm nổi bật</h3>
<p>Hệ thống hoạt động hoàn toàn độc lập trong ban ngày, pin lưu trữ cung cấp điện vào ban đêm. Chủ nhà có thể giám sát và điều khiển mọi lúc mọi nơi qua smartphone.</p>

<h3>Hiệu quả</h3>
<p>Tiết kiệm 95% hóa đơn tiền điện, tự cung tự cấp năng lượng sạch cho gia đình.</p>
      `,
      category: 'Dân dụng',
      client: 'Gia đình Nguyễn Văn A',
      isDisplay: true,
      showInHomepage: true,
      order: 2,
    },
    {
      title: 'Trung tâm thương mại Solar Plaza',
      location: 'Đồng Nai',
      capacity: '300kW',
      completedDate: 'Tháng 10, 2023',
      imageUrl: '/images/news-3.jpg',
      description: 'Dự án điện mặt trời cho trung tâm thương mại, cung cấp năng lượng sạch cho toàn bộ hệ thống.',
      detail: `
<h2>Năng lượng xanh cho trung tâm thương mại</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời quy mô lớn cho trung tâm thương mại Solar Plaza tại Đồng Nai.</p>

<h3>Quy mô dự án</h3>
<ul>
<li>Tổng công suất: 300kWp</li>
<li>Số lượng tấm pin: 750 tấm</li>
<li>Diện tích mái: 2,100m²</li>
<li>Inverter: 6 x 50kW</li>
<li>Hệ thống giám sát trung tâm</li>
</ul>

<h3>Giải pháp kỹ thuật</h3>
<p>Hệ thống được thiết kế tối ưu để cung cấp điện cho hệ thống điều hòa, chiếu sáng và các thiết bị điện trong giờ hoạt động của trung tâm thương mại.</p>

<h3>Lợi ích</h3>
<ul>
<li>Giảm 60% chi phí điện năng</li>
<li>Nâng cao hình ảnh thương hiệu xanh</li>
<li>Thu hút khách hàng quan tâm đến môi trường</li>
<li>Tiết kiệm 850 triệu đồng/năm</li>
</ul>
      `,
      category: 'Thương mại',
      client: 'Solar Plaza JSC',
      isDisplay: true,
      showInHomepage: true,
      order: 3,
    },
    {
      title: 'Khu công nghiệp Việt Phú',
      location: 'Bình Phước',
      capacity: '1.2MW',
      completedDate: 'Tháng 9, 2023',
      imageUrl: '/images/news-4.jpg',
      description: 'Hệ thống điện mặt trời lớn nhất khu vực với công nghệ tiên tiến, giảm 80% phát thải carbon.',
      detail: `
<h2>Dự án điện mặt trời quy mô lớn</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời công suất 1.2MWp cho Khu công nghiệp Việt Phú, Bình Phước - dự án lớn nhất của chúng tôi trong năm 2023.</p>

<h3>Thông số kỹ thuật</h3>
<ul>
<li>Tổng công suất: 1,200kWp (1.2MW)</li>
<li>Số lượng tấm pin: 3,000 tấm (400W/tấm)</li>
<li>Công nghệ: Tấm pin Bifacial Mono PERC</li>
<li>Inverter: 12 x 100kW</li>
<li>Diện tích: 8,500m²</li>
<li>Hệ thống giám sát AI</li>
</ul>

<h3>Công nghệ tiên tiến</h3>
<p>Sử dụng tấm pin 2 mặt (Bifacial) tăng hiệu suất 10-15%, kết hợp hệ thống giám sát AI dự đoán sản lượng và phát hiện sự cố tự động.</p>

<h3>Hiệu quả vượt trội</h3>
<ul>
<li>Sản lượng điện: 1,800,000 kWh/năm</li>
<li>Tiết kiệm: 3.2 tỷ đồng/năm</li>
<li>Giảm phát thải CO2: 1,350 tấn/năm</li>
<li>Thời gian hoàn vốn: 4.5 năm</li>
</ul>
      `,
      category: 'Công nghiệp',
      client: 'Khu công nghiệp Việt Phú',
      isDisplay: true,
      showInHomepage: true,
      order: 4,
    },
    {
      title: 'Trường học xanh Nguyễn Du',
      location: 'Long An',
      capacity: '50kW',
      completedDate: 'Tháng 8, 2023',
      imageUrl: '/images/news-5.jpg',
      description: 'Dự án điện mặt trời cho trường học, góp phần giáo dục ý thức bảo vệ môi trường cho học sinh.',
      detail: `
<h2>Năng lượng xanh cho giáo dục</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời cho Trường THPT Nguyễn Du, Long An - mô hình trường học xanh tiên phong.</p>

<h3>Cấu hình hệ thống</h3>
<ul>
<li>Công suất: 50kWp</li>
<li>Số lượng tấm pin: 125 tấm</li>
<li>Inverter: 1 x 50kW</li>
<li>Màn hình giám sát công khai</li>
<li>Hệ thống giáo dục tương tác</li>
</ul>

<h3>Giá trị giáo dục</h3>
<p>Ngoài việc tiết kiệm điện năng, hệ thống còn được tích hợp màn hình hiển thị công khai tại sảnh trường, giúp học sinh theo dõi sản lượng điện thực tế và hiểu về năng lượng tái tạo.</p>

<h3>Kết quả đạt được</h3>
<ul>
<li>Tiết kiệm 40% chi phí điện của trường</li>
<li>Giảm 37.5 tấn CO2/năm</li>
<li>Nâng cao ý thức môi trường cho 1,200 học sinh</li>
<li>Tạo nguồn học liệu thực tế cho môn Khoa học</li>
</ul>
      `,
      category: 'Giáo dục',
      client: 'Trường THPT Nguyễn Du',
      isDisplay: true,
      showInHomepage: true,
      order: 5,
    },
    {
      title: 'Resort biển Mũi Né',
      location: 'Phan Thiết',
      capacity: '100kW',
      completedDate: 'Tháng 7, 2023',
      imageUrl: '/images/news-6.jpg',
      description: 'Hệ thống điện mặt trời cho resort, kết hợp với hệ thống làm nóng nước năng lượng mặt trời.',
      detail: `
<h2>Giải pháp năng lượng toàn diện cho resort</h2>
<p>Dự án lắp đặt hệ thống điện mặt trời và nước nóng năng lượng mặt trời cho Mũi Né Beach Resort, Phan Thiết.</p>

<h3>Hệ thống điện mặt trời</h3>
<ul>
<li>Công suất: 100kWp</li>
<li>Số lượng tấm pin: 250 tấm</li>
<li>Inverter: 2 x 50kW</li>
<li>Pin lưu trữ: 50kWh</li>
</ul>

<h3>Hệ thống nước nóng mặt trời</h3>
<ul>
<li>30 bộ máy nước nóng năng lượng mặt trời</li>
<li>Tổng dung tích: 6,000 lít</li>
<li>Phục vụ 50 phòng nghỉ</li>
</ul>

<h3>Lợi ích cho resort</h3>
<ul>
<li>Tiết kiệm 65% chi phí điện và nước nóng</li>
<li>Nâng cao hình ảnh resort xanh, thân thiện môi trường</li>
<li>Thu hút khách du lịch có ý thức môi trường</li>
<li>Giảm 75 tấn CO2/năm</li>
<li>Tiết kiệm 280 triệu đồng/năm</li>
</ul>

<h3>Đánh giá của khách hàng</h3>
<p>"Hệ thống hoạt động rất ổn định, đặc biệt phù hợp với điều kiện nắng tốt tại Mũi Né. Khách hàng rất hài lòng với cam kết xanh của resort." - Giám đốc Resort</p>
      `,
      category: 'Du lịch',
      client: 'Mũi Né Beach Resort',
      isDisplay: true,
      showInHomepage: true,
      order: 6,
    },
  ];

  // Create projects
  for (const project of projects) {
    await prisma.project.create({
      data: project,
    });
  }

  console.log(`✅ Created ${projects.length} projects`);

  // Seed services based on SERVICES from constants.ts
  const services = [
    {
      title: 'Tư vấn và thiết kế hệ thống điện hộ gia đình',
      description: 'Dịch vụ tư vấn chuyên nghiệp và thiết kế hệ thống điện an toàn, hiệu quả cho hộ gia đình.',
      image: '/images/solar-installation-hero.jpg',
      features: [
        'Khảo sát hiện trạng điện',
        'Thiết kế sơ đồ mạch điện',
        'Tư vấn thiết bị phù hợp',
        'Hỗ trợ kỹ thuật 24/7',
      ],
      price: 'Liên hệ',
      category: 'household',
      duration: '1-2 ngày',
      warranty: '12 tháng',
      isActive: true,
      order: 1,
    },
    {
      title: 'Tư vấn và thiết kế hệ thống điện hộ doanh nghiệp',
      description: 'Giải pháp hệ thống điện công nghiệp quy mô lớn cho doanh nghiệp, nhà máy.',
      image: '/images/solar-panels-hero.jpg',
      features: [
        'Khảo sát công suất tiêu thụ',
        'Thiết kế hệ thống ba pha',
        'Tối ưu chi phí vận hành',
        'Tuân thủ tiêu chuẩn an toàn',
      ],
      price: 'Liên hệ',
      category: 'business',
      duration: '3-5 ngày',
      warranty: '24 tháng',
      isActive: true,
      order: 2,
    },
    {
      title: 'Thiết kế và thi công trọn gói hệ thống năng lượng mặt trời cho hộ gia đình',
      description: 'Dịch vụ trọn gói từ thiết kế đến lắp đặt hệ thống điện mặt trời cho hộ gia đình.',
      image: '/images/solar-battery-hero.jpg',
      features: [
        'Khảo sát mái nhà',
        'Thiết kế hệ thống phù hợp',
        'Lắp đặt chuyên nghiệp',
        'Bảo hành toàn diện',
      ],
      price: '150-300 triệu',
      category: 'household',
      duration: '5-7 ngày',
      warranty: '25 năm',
      isActive: true,
      order: 3,
    },
    {
      title: 'Thiết kế và thi công trọn gói hệ thống năng lượng mặt trời cho doanh nghiệp',
      description: 'Giải pháp năng lượng mặt trời quy mô lớn cho doanh nghiệp, tiết kiệm chi phí điện.',
      image: '/images/solar-inverter-hero.jpg',
      features: [
        'Khảo sát địa điểm lắp đặt',
        'Thiết kế hệ thống công suất cao',
        'Thi công theo tiêu chuẩn quốc tế',
        'Giám sát và bảo trì định kỳ',
      ],
      price: '500 triệu - 5 tỷ',
      category: 'business',
      duration: '2-4 tuần',
      warranty: '25 năm',
      isActive: true,
      order: 4,
    },
    {
      title: 'Thiết kế và thi công trạm sạc xe điện năng lượng mặt trời',
      description: 'Xây dựng trạm sạc xe điện sử dụng năng lượng mặt trời thân thiện môi trường.',
      image: '/images/product-1.jpg',
      features: [
        'Thiết kế trạm sạc hiện đại',
        'Tích hợp năng lượng mặt trời',
        'Hệ thống quản lý thông minh',
        'Hỗ trợ nhiều loại xe điện',
      ],
      price: '300-800 triệu',
      category: 'business',
      duration: '3-6 tuần',
      warranty: '20 năm',
      isActive: true,
      order: 5,
    },
    {
      title: 'Sửa chữa bảo trì điện',
      description: 'Dịch vụ sửa chữa, bảo trì hệ thống điện và thiết bị năng lượng mặt trời.',
      image: '/images/product-2.jpg',
      features: [
        'Kiểm tra định kỳ hệ thống',
        'Sửa chữa nhanh chóng',
        'Thay thế linh kiện chất lượng',
        'Hỗ trợ khẩn cấp 24/7',
      ],
      price: '500.000 - 5.000.000 VNĐ',
      category: 'maintenance',
      duration: '1-3 ngày',
      warranty: '6 tháng',
      isActive: true,
      order: 6,
    },
    {
      title: 'Tư vấn giải pháp tiết kiệm năng lượng',
      description: 'Tư vấn các giải pháp tối ưu hóa sử dụng năng lượng và giảm chi phí điện.',
      image: '/images/product-3.jpg',
      features: [
        'Phân tích mức tiêu thụ điện',
        'Đề xuất giải pháp tiết kiệm',
        'Tư vấn thiết bị hiệu quả cao',
        'Theo dõi hiệu suất dài hạn',
      ],
      price: '2-10 triệu',
      category: 'consultation',
      duration: '1-2 tuần',
      warranty: '12 tháng',
      isActive: true,
      order: 7,
    },
    {
      title: 'Lắp đặt hệ thống chiếu sáng LED năng lượng mặt trời',
      description: 'Giải pháp chiếu sáng tiết kiệm năng lượng sử dụng LED và pin mặt trời.',
      image: '/images/product-4.jpg',
      features: [
        'Đèn LED chất lượng cao',
        'Pin mặt trời bền bỉ',
        'Tự động bật/tắt',
        'Chống thấm nước IP65',
      ],
      price: '5-50 triệu',
      category: 'household',
      duration: '1-3 ngày',
      warranty: '3 năm',
      isActive: true,
      order: 8,
    },
  ];

  // Create services
  for (const service of services) {
    await prisma.service.create({
      data: service,
    });
  }

  console.log(`✅ Created ${services.length} services`);

  // Seed news articles based on allNewsArticles from NewsPageContent.tsx
  const newsArticles = [
    {
      title: 'Điện mặt trời được bán tối đa 20% công suất',
      excerpt: 'Quy định mới về việc bán điện mặt trời áp mái cho lưới điện quốc gia với tỷ lệ tối đa 20% công suất lắp đặt.',
      author: 'Administrator',
      publishedAt: new Date('2024-01-15'),
      imageUrl: '/images/news-1.jpg',
      category: 'Chính sách',
      readTime: '5 phút đọc',
      content: `
<p>Bộ Công thương vừa ban hành quy định mới về việc bán điện năng lượng mặt trời áp mái cho lưới điện quốc gia. Theo đó, các hộ gia đình và doanh nghiệp chỉ được phép bán tối đa 20% công suất lắp đặt của hệ thống điện mặt trời.</p>

<p>Quy định này nhằm đảm bảo tính ổn định của lưới điện quốc gia và tránh tình trạng quá tải trong những giờ cao điểm sản xuất điện mặt trời. Đồng thời, việc giới hạn này cũng khuyến khích người dân sử dụng năng lượng mặt trời chủ yếu cho nhu cầu tiêu thụ điện của chính mình.</p>

<h3>Lợi ích của quy định mới</h3>
<ul>
<li>Đảm bảo ổn định lưới điện quốc gia</li>
<li>Khuyến khích sử dụng năng lượng tái tạo bền vững</li>
<li>Tạo cơ chế minh bạch cho việc mua bán điện</li>
<li>Giảm thiểu rủi ro về kỹ thuật</li>
</ul>

<p>Các chuyên gia trong ngành đánh giá đây là bước tiến tích cực, tạo khuôn khổ pháp lý rõ ràng cho việc phát triển năng lượng mặt trời tại Việt Nam.</p>
      `,
      tags: ['Chính sách', 'Điện mặt trời', 'Lưới điện', 'Quy định'],
      isActive: true,
      order: 1,
    },
    {
      title: 'Giá điện sinh hoạt tăng thêm 4,8% từ ngày hôm nay',
      excerpt: 'EVN thông báo điều chỉnh tăng giá điện sinh hoạt bậc 3 trở lên nhằm khuyến khích tiết kiệm điện.',
      author: 'Administrator',
      publishedAt: new Date('2024-01-10'),
      imageUrl: '/images/news-2.jpg',
      category: 'Tin tức',
      readTime: '3 phút đọc',
      content: `
<p>Tập đoàn Điện lực Việt Nam (EVN) chính thức thông báo điều chỉnh tăng giá điện sinh hoạt đối với các bậc tiêu thụ từ bậc 3 trở lên, với mức tăng trung bình 4,8%.</p>

<p>Quyết định này được đưa ra nhằm khuyến khích người dân tiết kiệm điện và sử dụng năng lượng hiệu quả hơn. Đặc biệt, việc tăng giá chỉ áp dụng đối với các hộ gia đình có mức tiêu thụ điện cao.</p>

<h3>Chi tiết mức giá mới</h3>
<ul>
<li>Bậc 1 (0-50 kWh): Không thay đổi - 1.678 đồng/kWh</li>
<li>Bậc 2 (51-100 kWh): Không thay đổi - 1.734 đồng/kWh</li>
<li>Bậc 3 (101-200 kWh): Tăng 4,8% - 2.014 đồng/kWh</li>
<li>Bậc 4 (201-300 kWh): Tăng 4,8% - 2.536 đồng/kWh</li>
<li>Bậc 5 (301-400 kWh): Tăng 4,8% - 2.834 đồng/kWh</li>
<li>Bậc 6 (từ 401 kWh trở lên): Tăng 4,8% - 2.927 đồng/kWh</li>
</ul>

<p>Đây là thời điểm thích hợp để các hộ gia đình cân nhắc đầu tư vào hệ thống năng lượng mặt trời để giảm thiểu chi phí điện hàng tháng.</p>
      `,
      tags: ['Giá điện', 'EVN', 'Tiết kiệm điện', 'Năng lượng'],
      isActive: true,
      order: 2,
    },
    {
      title: 'Điện mặt trời thừa có thể bù trừ cho EVN',
      excerpt: 'Cơ chế bù trừ điện năng mới cho phép hộ gia đình có thể bán điện thừa từ hệ thống solar về lưới.',
      author: 'Administrator',
      publishedAt: new Date('2024-01-08'),
      imageUrl: '/images/news-3.jpg',
      category: 'Công nghệ',
      readTime: '7 phút đọc',
      content: `
<p>Cơ chế bù trừ điện năng (Net Metering) chính thức được triển khai, cho phép các hộ gia đình và doanh nghiệp có hệ thống điện mặt trời áp mái có thể bán điện thừa về lưới điện quốc gia.</p>

<p>Đây là bước đột phá quan trọng trong việc phát triển năng lượng tái tạo tại Việt Nam, tạo động lực mạnh mẽ cho các hộ gia đình đầu tư vào hệ thống năng lượng mặt trời.</p>

<h3>Cách thức hoạt động của cơ chế bù trừ</h3>
<ol>
<li>Lắp đặt đồng hồ điện 2 chiều để đo lượng điện tiêu thụ và phát lên lưới</li>
<li>Trong ngày, hệ thống solar sản xuất điện phục vụ nhu cầu sử dụng</li>
<li>Điện dư thừa được bán về EVN với giá bù trừ</li>
<li>Vào ban đêm hoặc ngày không nắng, hộ gia đình sử dụng điện từ lưới</li>
<li>Cuối tháng, EVN tính toán bù trừ giữa điện mua và điện bán</li>
</ol>

<h3>Lợi ích của cơ chế bù trừ</h3>
<ul>
<li>Giảm thời gian hoàn vốn đầu tư xuống còn 6-8 năm</li>
<li>Tối ưu hóa hiệu quả sử dụng năng lượng mặt trời</li>
<li>Góp phần giảm tải cho lưới điện quốc gia</li>
<li>Khuyến khích phát triển năng lượng sạch</li>
</ul>

<p>Với cơ chế này, việc đầu tư vào hệ thống năng lượng mặt trời trở nên hấp dẫn hơn bao giờ hết.</p>
      `,
      tags: ['Bù trừ điện', 'Net Metering', 'Solar', 'Lưới điện'],
      isActive: true,
      order: 3,
    },
    {
      title: 'Năng lượng mặt trời - Giải pháp "chống sốc" cho điện lưới',
      excerpt: 'Hệ thống năng lượng mặt trời giúp giảm tải cho lưới điện quốc gia trong những giờ cao điểm.',
      author: 'Administrator',
      publishedAt: new Date('2024-01-05'),
      imageUrl: '/images/news-4.jpg',
      category: 'Phân tích',
      readTime: '6 phút đọc',
      content: `
<p>Trong bối cảnh nhu cầu điện ngày càng tăng cao, đặc biệt vào các giờ cao điểm mùa hè, hệ thống năng lượng mặt trời phân tán đang trở thành giải pháp hiệu quả để giảm tải cho lưới điện quốc gia.</p>

<p>Theo báo cáo của Viện Năng lượng, việc phát triển năng lượng mặt trời áp mái có thể giảm tới 30% áp lực lên lưới điện trong những giờ có nắng tốt.</p>

<h3>Tác động tích cực đến hệ thống điện</h3>
<ul>
<li>Giảm tải đỉnh: Năng lượng mặt trời sản xuất nhiều nhất vào giờ cao điểm (10h-14h)</li>
<li>Phân tán nguồn điện: Giảm phụ thuộc vào các nhà máy điện tập trung</li>
<li>Tăng độ tin cậy: Đa dạng hóa nguồn cung cấp điện</li>
<li>Giảm tổn thất truyền tải: Sản xuất điện gần nơi tiêu thụ</li>
</ul>

<h3>Thách thức cần giải quyết</h3>
<p>Tuy nhiên, việc tích hợp năng lượng mặt trời vào lưới điện cũng đặt ra một số thách thức:</p>
<ul>
<li>Biến động theo thời tiết và thời gian trong ngày</li>
<li>Cần có hệ thống lưu trữ năng lượng</li>
<li>Đầu tư nâng cấp lưới điện thông minh</li>
<li>Đào tạo nhân lực vận hành và bảo trì</li>
</ul>

<p>Chuyên gia khuyến nghị cần có lộ trình phát triển hài hòa giữa năng lượng mặt trời và các nguồn năng lượng khác để đảm bảo an ninh năng lượng quốc gia.</p>
      `,
      tags: ['Lưới điện', 'An ninh năng lượng', 'Phân tích', 'Công nghệ'],
      isActive: true,
      order: 4,
    },
    {
      title: 'Nhà máy điện mặt trời lớn nhất thế giới',
      excerpt: 'Cập nhật về dự án nhà máy điện mặt trời có công suất lớn nhất thế giới và tác động đến ngành năng lượng.',
      author: 'Administrator',
      publishedAt: new Date('2024-01-03'),
      imageUrl: '/images/news-5.jpg',
      category: 'Quốc tế',
      readTime: '8 phút đọc',
      content: `
<p>Dự án nhà máy điện mặt trời Mohammed bin Rashid Al Maktoum Solar Park tại Dubai vừa hoàn thành giai đoạn cuối, trở thành nhà máy điện mặt trời lớn nhất thế giới với tổng công suất 5.000 MW.</p>

<p>Dự án này không chỉ là một kỳ tích kỹ thuật mà còn là minh chứng cho tiềm năng to lớn của năng lượng mặt trời trong việc đáp ứng nhu cầu năng lượng toàn cầu.</p>

<h3>Những con số ấn tượng</h3>
<ul>
<li>Tổng công suất: 5.000 MW</li>
<li>Diện tích: 77 km²</li>
<li>Số tấm pin mặt trời: Hơn 2,3 triệu tấm</li>
<li>Sản lượng điện hàng năm: 13,6 tỷ kWh</li>
<li>Giảm phát thải CO2: 6,5 triệu tấn/năm</li>
<li>Tổng đầu tư: 13,6 tỷ USD</li>
</ul>

<h3>Công nghệ tiên tiến được áp dụng</h3>
<p>Dự án sử dụng nhiều công nghệ tiên tiến nhất hiện tại:</p>
<ul>
<li>Tấm pin đơn tinh thể hiệu suất cao 22-24%</li>
<li>Hệ thống theo dõi mặt trời tự động</li>
<li>Công nghệ điện mặt trời nhiệt (CSP) với tháp năng lượng</li>
<li>Hệ thống lưu trữ năng lượng molten salt</li>
<li>AI và IoT trong quản lý vận hành</li>
</ul>

<h3>Tác động đến ngành năng lượng toàn cầu</h3>
<p>Thành công của dự án này mở ra nhiều hướng phát triển mới:</p>
<ul>
<li>Chứng minh tính khả thi của năng lượng mặt trời quy mô lớn</li>
<li>Giảm mạnh chi phí sản xuất điện mặt trời</li>
<li>Tạo động lực cho các quốc gia khác đầu tư vào năng lượng sạch</li>
<li>Phát triển chuỗi cung ứng và công nghệ hỗ trợ</li>
</ul>

<p>Việt Nam cũng có thể học hỏi kinh nghiệm từ dự án này để phát triển các nhà máy điện mặt trời quy mô lớn, góp phần đạt mục tiêu Net Zero vào năm 2050.</p>
      `,
      tags: ['Quốc tế', 'Dự án lớn', 'Công nghệ', 'Dubai'],
      isActive: true,
      order: 5,
    },
    {
      title: 'Top 10 thương hiệu năng lượng mặt trời hàng đầu thế giới',
      excerpt: 'Danh sách các thương hiệu dẫn đầu về công nghệ và chất lượng trong ngành năng lượng mặt trời.',
      author: 'Web Số',
      publishedAt: new Date('2024-01-01'),
      imageUrl: '/images/news-6.jpg',
      category: 'Tổng hợp',
      readTime: '10 phút đọc',
      content: `
<p>Ngành năng lượng mặt trời toàn cầu đã có những bước phát triển vượt bậc trong những năm gần đây. Dưới đây là danh sách 10 thương hiệu hàng đầu thế giới về sản xuất thiết bị năng lượng mặt trời.</p>

<h3>1. LONGi Solar (Trung Quốc)</h3>
<p>Dẫn đầu về công suất sản xuất với hơn 32 GW/năm. Chuyên về tấm pin đơn tinh thể hiệu suất cao.</p>

<h3>2. JinkoSolar (Trung Quốc)</h3>
<p>Thương hiệu có mặt tại hơn 160 quốc gia, nổi tiếng với độ bền và hiệu suất ổn định.</p>

<h3>3. Trina Solar (Trung Quốc)</h3>
<p>Tiên phong trong nghiên cứu công nghệ tấm pin thế hệ mới, đạt hiệu suất chuyển đổi cao nhất.</p>

<h3>4. Canadian Solar (Canada)</h3>
<p>Thương hiệu uy tín với hơn 20 năm kinh nghiệm, có mặt mạnh tại thị trường Bắc Mỹ và châu Âu.</p>

<h3>5. JA Solar (Trung Quốc)</h3>
<p>Chuyên sản xuất tấm pin PERC và TOPCon với hiệu suất cao, giá thành cạnh tranh.</p>

<h3>6. Hanwha Q CELLS (Hàn Quốc)</h3>
<p>Nổi tiếng với công nghệ Q.ANTUM, đảm bảo hiệu suất cao ngay cả trong điều kiện ánh sáng yếu.</p>

<h3>7. First Solar (Mỹ)</h3>
<p>Chuyên về công nghệ CdTe thin-film, phù hợp cho các dự án quy mô lớn tại vùng sa mạc.</p>

<h3>8. SunPower Corporation (Mỹ)</h3>
<p>Tấm pin hiệu suất cao nhất thị trường với công nghệ Maxeon, bảo hành lên đến 40 năm.</p>

<h3>9. Sharp Solar (Nhật Bản)</h3>
<p>Thương hiệu lâu đời với hơn 60 năm kinh nghiệm, chất lượng Nhật Bản được tin cậy toàn cầu.</p>

<h3>10. Panasonic Solar (Nhật Bản)</h3>
<p>Công nghệ HIT độc quyền, hiệu suất cao và độ bền vượt trội trong điều kiện khắc nghiệt.</p>

<h3>Xu hướng phát triển</h3>
<p>Các thương hiệu hàng đầu đang tập trung vào:</p>
<ul>
<li>Nâng cao hiệu suất chuyển đổi năng lượng</li>
<li>Giảm chi phí sản xuất</li>
<li>Phát triển công nghệ tấm pin thế hệ mới (Perovskite, Tandem)</li>
<li>Tích hợp AI và IoT trong hệ thống quản lý</li>
<li>Cam kết bền vững và thân thiện môi trường</li>
</ul>

<p>Tại Việt Nam, nhiều thương hiệu này đã có mặt và được tin dùng bởi các nhà thầu uy tín trong ngành.</p>
      `,
      tags: ['Thương hiệu', 'Tổng hợp', 'Đánh giá', 'Toàn cầu'],
      isActive: true,
      order: 6,
    },
    {
      title: 'Chính phủ hỗ trợ vay vốn lắp đặt điện mặt trời hộ gia đình',
      excerpt: 'Gói hỗ trợ tín dụng ưu đãi 50.000 tỷ đồng dành cho các hộ gia đình đầu tư hệ thống năng lượng mặt trời.',
      author: 'Administrator',
      publishedAt: new Date('2023-12-28'),
      imageUrl: '/images/news-1.jpg',
      category: 'Chính sách',
      readTime: '4 phút đọc',
      content: `
<p>Chính phủ vừa phê duyệt gói hỗ trợ tín dụng ưu đãi trị giá 50.000 tỷ đồng dành cho các hộ gia đình và doanh nghiệp nhỏ muốn đầu tư vào hệ thống năng lượng mặt trời.</p>

<h3>Điều kiện vay vốn</h3>
<ul>
<li>Lãi suất ưu đãi: 3-5%/năm</li>
<li>Thời gian vay: Tối đa 10 năm</li>
<li>Hạn mức vay: Tối đa 500 triệu đồng/hộ</li>
<li>Không yêu cầu tài sản thế chấp cho khoản vay dưới 200 triệu</li>
</ul>

<h3>Đối tượng được hỗ trợ</h3>
<ul>
<li>Hộ gia đình có nhu cầu lắp đặt hệ thống điện mặt trời áp mái</li>
<li>Doanh nghiệp vừa và nhỏ</li>
<li>Cơ sở sản xuất kinh doanh</li>
<li>Trường học và bệnh viện</li>
</ul>

<p>Đây là cơ hội tuyệt vời để các hộ gia đình tiếp cận nguồn vốn ưu đãi, giảm gánh nặng tài chính ban đầu khi đầu tư vào năng lượng sạch.</p>
      `,
      tags: ['Hỗ trợ vốn', 'Chính sách', 'Hộ gia đình'],
      isActive: true,
      order: 7,
    },
    {
      title: 'Công nghệ tấm pin mặt trời thế hệ mới với hiệu suất 47%',
      excerpt: 'Các nhà khoa học đã phát triển thành công tấm pin mặt trời có hiệu suất chuyển đổi cao kỷ lục.',
      author: 'Tech Solar',
      publishedAt: new Date('2023-12-25'),
      imageUrl: '/images/news-2.jpg',
      category: 'Công nghệ',
      readTime: '6 phút đọc',
      content: `
<p>Đột phá mới trong công nghệ tấm pin mặt trời: Các nhà khoa học tại Viện Năng lượng Fraunhofer (Đức) đã phát triển thành công tấm pin mặt trời đa lớp với hiệu suất chuyển đổi năng lượng đạt 47.6%, phá vỡ kỷ lục thế giới.</p>

<h3>Công nghệ đột phá</h3>
<p>Tấm pin sử dụng công nghệ tandem kết hợp nhiều lớp vật liệu bán dẫn khác nhau:</p>
<ul>
<li>Lớp trên: Perovskite - hấp thụ ánh sáng xanh và tử ngoại</li>
<li>Lớp giữa: Gallium arsenide - hấp thụ ánh sáng vàng và xanh lá</li>
<li>Lớp dưới: Silicon - hấp thụ ánh sáng đỏ và hồng ngoại</li>
</ul>

<h3>Ý nghĩa của đột phá</h3>
<p>Với hiệu suất gần 50%, công nghệ này có thể:</p>
<ul>
<li>Giảm diện tích lắp đặt xuống 50% so với tấm pin thông thường</li>
<li>Tăng gấp đôi sản lượng điện trên cùng diện tích mái</li>
<li>Giảm chi phí lắp đặt và bảo trì</li>
<li>Mở ra khả năng ứng dụng cho các không gian hạn chế</li>
</ul>

<h3>Lộ trình thương mại hóa</h3>
<p>Dự kiến công nghệ này sẽ được thương mại hóa trong vòng 3-5 năm tới với mức giá cạnh tranh.</p>
      `,
      tags: ['Công nghệ mới', 'Hiệu suất cao', 'Nghiên cứu'],
      isActive: true,
      order: 8,
    },
    {
      title: 'Dự báo thị trường năng lượng mặt trời Việt Nam 2024',
      excerpt: 'Thị trường điện mặt trời Việt Nam dự kiến tăng trưởng 45% trong năm 2024 với nhiều chính sách hỗ trợ mới.',
      author: 'Market Analyst',
      publishedAt: new Date('2023-12-20'),
      imageUrl: '/images/news-3.jpg',
      category: 'Thị trường',
      readTime: '7 phút đọc',
      content: `
<p>Báo cáo thị trường năng lượng mặt trời Việt Nam 2024 cho thấy triển vọng tích cực với tốc độ tăng trưởng dự kiến đạt 45% so với năm 2023.</p>

<h3>Động lực tăng trưởng</h3>
<ul>
<li>Giá điện sinh hoạt tăng, khuyến khích đầu tư solar</li>
<li>Chính sách hỗ trợ vay vốn ưu đãi</li>
<li>Cơ chế bù trừ điện năng (Net Metering) được triển khai rộng rãi</li>
<li>Chi phí lắp đặt giảm 20-30% so với 2 năm trước</li>
<li>Công nghệ tấm pin ngày càng hiệu quả hơn</li>
</ul>

<h3>Phân khúc thị trường</h3>
<p>Thị trường được chia thành các phân khúc chính:</p>
<ul>
<li>Hộ gia đình: Chiếm 40% thị trường, tăng trưởng 50%</li>
<li>Doanh nghiệp vừa và nhỏ: 35%, tăng trưởng 45%</li>
<li>Nhà máy và khu công nghiệp: 20%, tăng trưởng 35%</li>
<li>Dự án quy mô lớn: 5%, tăng trưởng 40%</li>
</ul>

<h3>Thách thức</h3>
<ul>
<li>Cần nâng cấp hạ tầng lưới điện</li>
<li>Thiếu nhân lực kỹ thuật chất lượng cao</li>
<li>Cạnh tranh gay gắt về giá</li>
<li>Vấn đề chất lượng sản phẩm từ một số nhà cung cấp</li>
</ul>

<p>Nhìn chung, 2024 hứa hẹn là năm bùng nổ của ngành năng lượng mặt trời tại Việt Nam.</p>
      `,
      tags: ['Thị trường', 'Dự báo', 'Tăng trưởng'],
      isActive: true,
      order: 9,
    },
    {
      title: 'Lắp đặt hệ thống solar cho trường học - Xu hướng mới',
      excerpt: 'Nhiều trường học tại Việt Nam đã bắt đầu đầu tư hệ thống điện mặt trời để tiết kiệm chi phí và giáo dục môi trường.',
      author: 'Education Solar',
      publishedAt: new Date('2023-12-15'),
      imageUrl: '/images/news-4.jpg',
      category: 'Giáo dục',
      readTime: '5 phút đọc',
      content: `
<p>Xu hướng lắp đặt hệ thống năng lượng mặt trời cho các trường học đang ngày càng phổ biến tại Việt Nam, mang lại nhiều lợi ích về kinh tế và giáo dục.</p>

<h3>Lợi ích kép: Kinh tế và Giáo dục</h3>
<p>Các trường học lắp đặt solar không chỉ tiết kiệm chi phí điện mà còn tạo ra môi trường học tập thực tế về năng lượng tái tạo cho học sinh.</p>

<h3>Các trường tiên phong</h3>
<ul>
<li>Trường THPT Lê Quý Đôn (TP.HCM): Tiết kiệm 40% chi phí điện/năm</li>
<li>Trường Quốc tế Singapore (Hà Nội): Hệ thống 500kWp</li>
<li>Trường Đại học Bách Khoa (TP.HCM): Dự án 1MWp</li>
<li>Trường THCS Nguyễn Du (Đà Nẵng): Hệ thống 100kWp</li>
</ul>

<h3>Mô hình triển khai</h3>
<p>Các trường học có thể lựa chọn nhiều mô hình:</p>
<ul>
<li>Đầu tư trực tiếp: Trường tự bỏ vốn lắp đặt</li>
<li>Thuê mua tài chính: Trả góp trong 5-7 năm</li>
<li>PPP: Hợp tác công tư với doanh nghiệp năng lượng</li>
<li>Tài trợ: Nhận hỗ trợ từ các tổ chức, doanh nghiệp</li>
</ul>

<h3>Giá trị giáo dục</h3>
<ul>
<li>Học sinh được tiếp cận trực tiếp với công nghệ xanh</li>
<li>Nâng cao ý thức bảo vệ môi trường</li>
<li>Tạo nguồn dữ liệu thực tế cho các bài học STEM</li>
<li>Truyền cảm hứng cho thế hệ trẻ về năng lượng sạch</li>
</ul>

<p>Bộ Giáo dục đang xây dựng chương trình khuyến khích các trường học trên toàn quốc đầu tư vào năng lượng mặt trời.</p>
      `,
      tags: ['Giáo dục', 'Trường học', 'Tiết kiệm'],
      isActive: true,
      order: 10,
    },
  ];

  // Create news articles
  for (const article of newsArticles) {
    await prisma.news.create({
      data: article,
    });
  }

  console.log(`✅ Created ${newsArticles.length} news articles`);

  // Create default admin user if it doesn't exist
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10); 
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log('✅ Created default admin user (username: admin, password: admin123)');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
  } else {
    console.log('ℹ️  Admin user already exists, skipping user creation');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
