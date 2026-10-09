import type { Segment } from "@solar/core";

/**
 * CÔNG TRÌNH ĐÃ THỰC HIỆN — gallery trang chủ + trang /cong-trinh/[slug].
 * storyId (tùy chọn): id video trong data/stories.ts → thẻ hiện nút play, bấm mở trình phát đúng video đó.
 * [DỮ LIỆU MẪU] — thay bằng công trình thật (ảnh, công suất, tiết kiệm/tháng theo hóa đơn thực tế).
 */
export type Project = {
  slug: string;
  title: string;
  segment: Segment;
  location: string;
  kwp: number;
  /** Tiền điện giảm mỗi tháng, VNĐ. */
  savingPerMonth: number;
  image: string;
  storyId?: string;
  detail: string;
  metrics: [label: string, value: string][];
};

export const PROJECTS: Project[] = [
  { slug: "nha-pho-binh-thanh", title: "Nhà phố 3 tầng Bình Thạnh", segment: "household", location: "TP Hồ Chí Minh", kwp: 6, savingPerMonth: 1_650_000, image: "/images/illustrations/home-solar.webp", storyId: "nha-pho-binh-thanh",
    detail: "Gia đình 5 người, 3 máy lạnh chạy gần như cả ngày. Hệ hòa lưới 6 kWp đặt trên sân thượng, cắt phần điện ở bậc giá cao nhất.", metrics: [["Công suất", "6 kWp"], ["Số tấm", "11 tấm 580W"], ["Thi công", "1 ngày"], ["Hóa đơn", "2,4 → 0,8 triệu"]] },
  { slug: "biet-thu-da-lat", title: "Biệt thự hybrid Đà Lạt", segment: "household", location: "Lâm Đồng", kwp: 10, savingPerMonth: 2_300_000, image: "/images/solar-battery-hero.jpg", storyId: "biet-thu-da-lat",
    detail: "Hệ hybrid 10 kWp kèm pin lưu trữ 10 kWh, ưu tiên cấp điện cho bơm nước, camera và tủ lạnh khi mất điện lưới.", metrics: [["Công suất", "10 kWp"], ["Lưu trữ", "10 kWh LFP"], ["Dự phòng", "~6 giờ"], ["Theo dõi", "App 24/7"]] },
  { slug: "sieu-thi-mini-can-tho", title: "Siêu thị mini Ninh Kiều", segment: "shop", location: "Cần Thơ", kwp: 15, savingPerMonth: 4_800_000, image: "/images/illustrations/shop-solar.webp", storyId: "tiem-tap-hoa-can-tho",
    detail: "Tủ mát, tủ đông và điều hòa chạy từ 7h đến 22h. Phần lớn điện dùng trong giờ nắng nên hệ 15 kWp gần như tự dùng toàn bộ.", metrics: [["Công suất", "15 kWp"], ["Tự dùng", "~92%"], ["Thi công", "2 ngày"], ["Hoàn vốn", "~3,5 năm"]] },
  { slug: "chuoi-cafe-da-nang", title: "Chuỗi cà phê 3 chi nhánh", segment: "shop", location: "Đà Nẵng", kwp: 30, savingPerMonth: 9_200_000, image: "/images/solar-inverter-hero.jpg", storyId: "chuoi-cafe-da-nang",
    detail: "Lắp đồng loạt 3 điểm bán, mỗi điểm 10 kWp, quản lý sản lượng cả chuỗi trên một tài khoản ứng dụng.", metrics: [["Công suất", "3 × 10 kWp"], ["Điểm bán", "3"], ["Thi công", "Ngoài giờ bán"], ["Giám sát", "1 tài khoản"]] },
  { slug: "xuong-co-khi-dong-nai", title: "Xưởng cơ khí Biên Hòa", segment: "factory", location: "Đồng Nai", kwp: 250, savingPerMonth: 52_000_000, image: "/images/solar-panels-hero.jpg", storyId: "xuong-co-khi-dong-nai",
    detail: "Máy CNC, máy nén khí chạy 2 ca ban ngày. Thi công theo khu vực mái để không dừng sản xuất.", metrics: [["Công suất", "250 kWp"], ["Tự dùng", "~90%"], ["Thi công", "4 tuần"], ["Giám sát", "Theo string"]] },
  { slug: "kho-lanh-tay-ninh", title: "Kho lạnh nông sản", segment: "factory", location: "Tây Ninh", kwp: 500, savingPerMonth: 98_000_000, image: "/images/illustrations/cold-storage-solar.webp", storyId: "kho-lanh-long-an",
    detail: "Tải lạnh ổn định cả ngày giúp hệ 500 kWp bám sát nhu cầu điện. Bố trí string theo vùng mái để dễ kiểm tra, vệ sinh.", metrics: [["Công suất", "500 kWp"], ["Tự dùng", "~95%"], ["Thi công", "6 tuần"], ["CO₂ giảm", "~420 tấn/năm"]] },
  { slug: "trai-ga-tay-ninh", title: "Trại gà đẻ 40.000 con", segment: "farm", location: "Tây Ninh", kwp: 120, savingPerMonth: 26_000_000, image: "/images/illustrations/farm-hybrid-solar.webp", storyId: "trai-ga-tay-ninh",
    detail: "Quạt hút, hệ làm mát và chiếu sáng chuồng chạy liên tục. Khung pin chống ăn mòn amoniac, có pin lưu trữ cho tải quan trọng.", metrics: [["Công suất", "120 kWp"], ["Lưu trữ", "60 kWh"], ["Tải ưu tiên", "Quạt, bơm"], ["Giám sát", "24/7"]] },
  { slug: "trai-heo-dong-thap", title: "Trang trại heo Cao Lãnh", segment: "farm", location: "Đồng Tháp", kwp: 80, savingPerMonth: 17_500_000, image: "/images/projects/project_1772874891937.webp", storyId: "trai-heo-dong-thap",
    detail: "Lắp trên mái chuồng và nhà kho, cấp điện cho bơm, quạt và máy ép phân. Tiền điện giảm khoảng một nửa.", metrics: [["Công suất", "80 kWp"], ["Hóa đơn", "−50%"], ["Thi công", "10 ngày"], ["Hoàn vốn", "~4 năm"]] },
];

export const projectBySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug);
