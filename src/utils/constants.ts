// Constants for the solar website

export const SITE_CONFIG = {
  name: "Trọng Tín Solar",
  description: "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao",
  url: "https://phanphoisolar.com",
  ogImage: "/og-image.jpg",
  phone: "0909019234",
  email: "info@phanphoisolar.com",
  address: "Lấp Vò, Đồng Tháp, Việt Nam",
  workingHours: "Thứ 2 - Thứ 6: 8:00 - 17:30, Thứ 7: 8:00 - 12:00",
  coordinates: {
    lat: 10.362137,
    lng: 105.520426,
  },
};

export const NAVIGATION_ITEMS = [
  { name: "Trang chủ", href: "/" },
  { name: "Về chúng tôi", href: "/about-us" },
  { name: "Sản phẩm", href: "/product" },
  { name: "Dịch vụ", href: "/service" },
  { name: "Biến tần Inverter", href: "/inverter" },
  { name: "Tấm pin năng lượng mặt trời", href: "/solar-panels" },
  { name: "Pin lưu trữ", href: "/batteries" },
  { name: "Tin tức", href: "/news" },
  { name: "Liên hệ", href: "/contact" },
];

export const SOCIAL_LINKS = [
  { name: "Facebook", url: "#", icon: "facebook" },
  { name: "YouTube", url: "#", icon: "youtube" },
  { name: "TikTok", url: "#", icon: "tiktok" },
];

export const STATISTICS = [
  { label: "Năm kinh nghiệm", value: "10+", color: "text-solar-blue" },
  { label: "Dự án hoàn thành", value: "1000+", color: "text-solar-blue" },
  { label: "Hỗ trợ kỹ thuật", value: "24/7", color: "text-solar-blue" },
];

export const PRODUCT_STATISTICS = [
  { label: "Tấm pin lắp đặt", value: "5000+", color: "text-solar-blue" },
  { label: "Hệ thống hoàn thiện", value: "500+", color: "text-solar-orange" },
  { label: "Khách hàng hài lòng", value: "98%", color: "text-solar-green" },
  { label: "Hỗ trợ kỹ thuật", value: "24/7", color: "text-solar-yellow" },
];

export const SERVICES = [
  {
    id: 1,
    title: "Tư vấn và thiết kế hệ thống điện hộ gia đình",
    description:
      "Dịch vụ tư vấn chuyên nghiệp và thiết kế hệ thống điện an toàn, hiệu quả cho hộ gia đình.",
    image: "/images/solar-installation-hero.jpg",
    features: [
      "Khảo sát hiện trạng điện",
      "Thiết kế sơ đồ mạch điện",
      "Tư vấn thiết bị phù hợp",
      "Hỗ trợ kỹ thuật 24/7",
    ],
    price: "Liên hệ",
    category: "household" as const,
    duration: "1-2 ngày",
    warranty: "12 tháng",
  },
  {
    id: 2,
    title: "Tư vấn và thiết kế hệ thống điện hộ doanh nghiệp",
    description:
      "Giải pháp hệ thống điện công nghiệp quy mô lớn cho doanh nghiệp, nhà máy.",
    image: "/images/solar-panels-hero.jpg",
    features: [
      "Khảo sát công suất tiêu thụ",
      "Thiết kế hệ thống ba pha",
      "Tối ưu chi phí vận hành",
      "Tuân thủ tiêu chuẩn an toàn",
    ],
    price: "Liên hệ",
    category: "business" as const,
    duration: "3-5 ngày",
    warranty: "24 tháng",
  },
  {
    id: 3,
    title:
      "Thiết kế và thi công trọn gói hệ thống năng lượng mặt trời cho hộ gia đình",
    description:
      "Dịch vụ trọn gói từ thiết kế đến lắp đặt hệ thống điện mặt trời cho hộ gia đình.",
    image: "/images/solar-battery-hero.jpg",
    features: [
      "Khảo sát mái nhà",
      "Thiết kế hệ thống phù hợp",
      "Lắp đặt chuyên nghiệp",
      "Bảo hành toàn diện",
    ],
    price: "150-300 triệu",
    category: "household" as const,
    duration: "5-7 ngày",
    warranty: "25 năm",
  },
  {
    id: 4,
    title:
      "Thiết kế và thi công trọn gói hệ thống năng lượng mặt trời cho doanh nghiệp",
    description:
      "Giải pháp năng lượng mặt trời quy mô lớn cho doanh nghiệp, tiết kiệm chi phí điện.",
    image: "/images/solar-inverter-hero.jpg",
    features: [
      "Khảo sát địa điểm lắp đặt",
      "Thiết kế hệ thống công suất cao",
      "Thi công theo tiêu chuẩn quốc tế",
      "Giám sát và bảo trì định kỳ",
    ],
    price: "500 triệu - 5 tỷ",
    category: "business" as const,
    duration: "2-4 tuần",
    warranty: "25 năm",
  },
  {
    id: 5,
    title: "Thiết kế và thi công trạm sạc xe điện năng lượng mặt trời",
    description:
      "Xây dựng trạm sạc xe điện sử dụng năng lượng mặt trời thân thiện môi trường.",
    image: "/images/product-1.jpg",
    features: [
      "Thiết kế trạm sạc hiện đại",
      "Tích hợp năng lượng mặt trời",
      "Hệ thống quản lý thông minh",
      "Hỗ trợ nhiều loại xe điện",
    ],
    price: "300-800 triệu",
    category: "business" as const,
    duration: "3-6 tuần",
    warranty: "20 năm",
  },
  {
    id: 6,
    title: "Sửa chữa bảo trì điện",
    description:
      "Dịch vụ sửa chữa, bảo trì hệ thống điện và thiết bị năng lượng mặt trời.",
    image: "/images/product-2.jpg",
    features: [
      "Kiểm tra định kỳ hệ thống",
      "Sửa chữa nhanh chóng",
      "Thay thế linh kiện chất lượng",
      "Hỗ trợ khẩn cấp 24/7",
    ],
    price: "500.000 - 5.000.000 VNĐ",
    category: "maintenance" as const,
    duration: "1-3 ngày",
    warranty: "6 tháng",
  },
  {
    id: 7,
    title: "Tư vấn giải pháp tiết kiệm năng lượng",
    description:
      "Tư vấn các giải pháp tối ưu hóa sử dụng năng lượng và giảm chi phí điện.",
    image: "/images/product-3.jpg",
    features: [
      "Phân tích mức tiêu thụ điện",
      "Đề xuất giải pháp tiết kiệm",
      "Tư vấn thiết bị hiệu quả cao",
      "Theo dõi hiệu suất dài hạn",
    ],
    price: "2-10 triệu",
    category: "consultation" as const,
    duration: "1-2 tuần",
    warranty: "12 tháng",
  },
  {
    id: 8,
    title: "Lắp đặt hệ thống chiếu sáng LED năng lượng mặt trời",
    description:
      "Giải pháp chiếu sáng tiết kiệm năng lượng sử dụng LED và pin mặt trời.",
    image: "/images/product-4.jpg",
    features: [
      "Đèn LED chất lượng cao",
      "Pin mặt trời bền bỉ",
      "Tự động bật/tắt",
      "Chống thấm nước IP65",
    ],
    price: "5-50 triệu",
    category: "household" as const,
    duration: "1-3 ngày",
    warranty: "3 năm",
  },
];

export const SERVICE_CATEGORIES = [
  { id: "all", name: "Tất cả dịch vụ", count: SERVICES.length },
  {
    id: "household",
    name: "Hộ gia đình",
    count: SERVICES.filter((s) => s.category === "household").length,
  },
  {
    id: "business",
    name: "Doanh nghiệp",
    count: SERVICES.filter((s) => s.category === "business").length,
  },
  {
    id: "maintenance",
    name: "Bảo trì",
    count: SERVICES.filter((s) => s.category === "maintenance").length,
  },
  {
    id: "consultation",
    name: "Tư vấn",
    count: SERVICES.filter((s) => s.category === "consultation").length,
  },
];
