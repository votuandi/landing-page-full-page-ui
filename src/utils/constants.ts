import type { Service } from "@/types";

export const SITE_CONFIG = {
  name: "Minwy Solar",
  description: "Phân phối thiết bị, tư vấn thiết kế và thi công điện mặt trời cho gia đình và doanh nghiệp.",
  url: "https://solarservice.minwysoft.com",
  phone: "0708699808",
  displayPhone: "0708 699 808",
  zalo: "https://zalo.me/0708699808",
  messenger: "https://m.me/minwysolar",
  email: "hello@minwysolar.vn",
  address: "128 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. Hồ Chí Minh",
  workingHours: "Thứ 2 - Thứ 7: 08:00 - 17:30",
  coordinates: { lat: 10.729, lng: 106.702 },
  calculator: {
    averageResidentialRate: 2850,
    averageBusinessRate: 3100,
    systemCostPerKwp: 14500000,
    selfUseRatioResidential: 0.78,
    selfUseRatioBusiness: 0.9,
    regionalSunHours: { bac: 3.4, trung: 4.2, nam: 4.7 },
  },
} as const;

export const NAVIGATION_ITEMS = [
  { name: "Trang chủ", href: "/" },
  { name: "Sản phẩm", href: "/product" },
  { name: "Dịch vụ", href: "/service" },
  { name: "Tin tức", href: "/news" },
  { name: "Về chúng tôi", href: "/about-us" },
  { name: "Liên hệ", href: "/contact-us" },
] as const;

export const SOCIAL_LINKS = [
  { name: "Facebook", url: "https://facebook.com/minwysolar", icon: "facebook" },
  { name: "YouTube", url: "https://youtube.com/@minwysolar", icon: "youtube" },
  { name: "TikTok", url: "https://tiktok.com/@minwysolar", icon: "tiktok" },
] as const;

export const STATISTICS = [
  { label: "Năm kinh nghiệm", value: "10+", color: "text-emerald-700" },
  { label: "Dự án hoàn thành", value: "1.000+", color: "text-emerald-700" },
  { label: "Tổng công suất", value: "50 MW+", color: "text-emerald-700" },
  { label: "Bảo hành thiết bị", value: "25 năm", color: "text-emerald-700" },
] as const;

export const PRODUCT_STATISTICS = [
  { label: "Tấm pin lắp đặt", value: "5.000+", color: "text-emerald-700" },
  { label: "Hệ thống hoàn thiện", value: "500+", color: "text-emerald-700" },
  { label: "Khách hàng hài lòng", value: "98%", color: "text-emerald-700" },
  { label: "Hỗ trợ kỹ thuật", value: "24/7", color: "text-emerald-700" },
] as const;

export const SERVICES: Service[] = [
  { id: 1, title: "Tư vấn & thiết kế điện mặt trời", description: "Khảo sát tải điện, mái, hướng nắng và thiết kế cấu hình tối ưu theo mục tiêu hoàn vốn.", image: "/images/solar-installation-hero.jpg", features: ["Khảo sát hiện trạng", "Mô phỏng sản lượng", "Thiết kế kỹ thuật", "Dự toán đầu tư"], price: "Miễn phí khảo sát", category: "consultation", duration: "1-2 ngày", warranty: "Hồ sơ rõ ràng" },
  { id: 2, title: "Lắp đặt solar hộ gia đình", description: "Giải pháp hòa lưới hoặc hybrid giúp giảm hóa đơn điện và có thể dự phòng khi mất điện.", image: "/images/solar-panels-hero.jpg", features: ["3-15 kWp", "Thi công gọn", "Giám sát từ xa", "Bảo hành dài hạn"], price: "Từ 45 triệu", category: "household", duration: "2-5 ngày", warranty: "Tới 25 năm" },
  { id: 3, title: "Điện mặt trời nhà xưởng", description: "Giải pháp công suất lớn tối ưu điện giờ cao điểm cho nhà máy, kho và cơ sở sản xuất.", image: "/images/solar-inverter-hero.jpg", features: ["Khảo sát phụ tải", "Thiết kế 3 pha", "An toàn PCCC", "Theo dõi hiệu suất"], price: "Theo công suất", category: "business", duration: "2-6 tuần", warranty: "Tới 25 năm" },
  { id: 4, title: "Bảo trì & vệ sinh hệ thống", description: "Kiểm tra thiết bị, vệ sinh tấm pin và đánh giá hiệu suất để duy trì sản lượng ổn định.", image: "/images/product-2.jpg", features: ["Đo kiểm điện", "Vệ sinh tấm pin", "Kiểm tra inverter", "Báo cáo hiệu suất"], price: "Từ 800.000đ", category: "maintenance", duration: "Trong ngày", warranty: "Biên bản kỹ thuật" },
  { id: 5, title: "Sửa chữa & nâng cấp hệ thống", description: "Chẩn đoán lỗi, thay thế thiết bị và nâng cấp pin lưu trữ cho hệ thống đang vận hành.", image: "/images/solar-battery-hero.jpg", features: ["Kiểm tra tại chỗ", "Xử lý lỗi inverter", "Nâng cấp lưu trữ", "Tối ưu cấu hình"], price: "Liên hệ báo giá", category: "maintenance", duration: "1-3 ngày", warranty: "Theo hạng mục" },
];

export const SERVICE_CATEGORIES = [
  { id: "all", name: "Tất cả dịch vụ", count: SERVICES.length },
  { id: "household", name: "Hộ gia đình", count: SERVICES.filter((s) => s.category === "household").length },
  { id: "business", name: "Doanh nghiệp", count: SERVICES.filter((s) => s.category === "business").length },
  { id: "maintenance", name: "Bảo trì", count: SERVICES.filter((s) => s.category === "maintenance").length },
  { id: "consultation", name: "Tư vấn", count: SERVICES.filter((s) => s.category === "consultation").length },
] as const;
