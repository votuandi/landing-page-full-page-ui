/** [DỮ LIỆU MẪU] Hero trang chủ t15; số liệu, điểm đánh giá và thẻ dữ liệu là hư cấu. */
import type { z } from "zod";
import type { heroSchema } from "./schema";

export const heroFixture = {
  badge: { vi: "Năng lượng xanh • Phân phối thiết bị • Tổng thầu EPC", en: "Green energy • Equipment • EPC contractor" },
  title: {
    lead: { vi: "Điện sạch từ", en: "Clean power from" },
    highlight: { vi: "mái nhà của bạn", en: "your own roof" },
    sub: { vi: "thiết bị chính hãng,", en: "genuine equipment," },
    subHighlight: { vi: "lắp đặt trọn gói", en: "turnkey installation" },
  },
  description: {
    vi: "Phân phối tấm pin, inverter, pin lưu trữ, BESS, đèn năng lượng mặt trời đủ CO/CQ — và thi công trọn gói cho hộ gia đình, cửa hàng, nhà xưởng, trang trại. Xem công trình thật, biết chi phí và tiền tiết kiệm trước khi gọi.",
    en: "Panels, inverters, batteries, BESS and solar lights with full CO/CQ — plus turnkey installation for homes, shops, factories and farms. See real projects and know the cost and savings before you call.",
  },
  primaryCta: { kind: "anchor", value: "du-toan", label: { vi: "Dự toán chi phí", en: "Estimate cost" } },
  secondaryCta: { kind: "anchor", value: "video-cong-trinh", label: { vi: "Xem công trình thực tế", en: "Watch real projects" } },
  rating: { score: 4.9, count: 312, url: "https://www.google.com/maps", label: { vi: "đánh giá Google", en: "Google reviews" } },
  stats: [
    { value: 14, suffix: "+", unit: { vi: "năm", en: "yrs" }, label: { vi: "kinh nghiệm", en: "experience" } },
    { value: 186.4, decimals: 1, unit: { vi: "MWp", en: "MWp" }, label: { vi: "đã cung cấp & lắp đặt", en: "supplied & installed" } },
    { value: 12_500, suffix: "+", unit: { vi: "khách", en: "clients" }, label: { vi: "dùng điện mặt trời", en: "on solar power" } },
  ],
  image: { id: "/images/services/service_1772895565903.webp", alt: { vi: "Kỹ sư kiểm tra hệ thống điện mặt trời áp mái", en: "Engineer inspecting a rooftop solar system" }, focal: { x: 0.72, y: 0.5 } },
  chips: [
    { label: { vi: "Tấm pin N-type 590W", en: "N-type 590W panels" }, icon: "sun", tone: "accent" },
    { label: { vi: "Inverter hybrid", en: "Hybrid inverter" }, icon: "cpu", tone: "secondary" },
    { label: { vi: "Pin lưu trữ LFP", en: "LFP storage" }, icon: "battery", tone: "primary" },
    { label: { vi: "Đèn năng lượng mặt trời", en: "Solar lights" }, icon: "light", tone: "leaf" },
  ],
  outputCard: { label: { vi: "Sản lượng hôm nay", en: "Today's output" }, value: "1.248", unit: { vi: "kWh" }, liveLabel: "Live" },
  savingCard: { label: { vi: "Hóa đơn giảm", en: "Bill reduced" }, value: "−38%", unit: { vi: "/ tháng*", en: "/ month*" } },
  co2Card: { label: { vi: "CO₂ giảm mỗi năm", en: "CO₂ avoided / year" }, value: "~840", unit: { vi: "tấn", en: "tonnes" } },
} satisfies z.input<typeof heroSchema>;
