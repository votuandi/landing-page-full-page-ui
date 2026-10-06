import type { Segment } from "@/config/solar";

/**
 * CÔNG TRÌNH ĐÃ THỰC HIỆN — hiển thị ở gallery trang chủ và trang /cong-trinh/[slug].
 * savingPerMonth: VNĐ/tháng. [DỮ LIỆU MẪU] — thay bằng công trình thật và ảnh thật.
 */
export type Project = {
  slug: string;
  title: string;
  segment: Segment;
  type: string;
  location: string;
  kwp: number;
  savingPerMonth: number;
  image: string;
  detail: string;
  metrics: [string, string][];
};

export const PROJECTS: Project[] = [
  { slug: "nha-pho-thu-duc", title: "Nhà phố 4 tầng Thủ Đức", segment: "household", type: "Hộ gia đình", location: "TP Hồ Chí Minh", kwp: 6, savingPerMonth: 2_100_000, image: "/images/illustrations/home-solar.webp",
    detail: "Gia đình 5 người, 4 điều hòa và bơm nhiệt. Hệ hybrid giúp cắt phần điện bậc 5–6 và có điện dự phòng buổi tối.", metrics: [["Công suất", "6 kWp"], ["Pin lưu trữ", "5 kWh"], ["Thi công", "1 ngày"], ["Giảm hóa đơn", "~70%"]] },
  { slug: "biet-thu-da-lat", title: "Biệt thự nghỉ dưỡng Đà Lạt", segment: "household", type: "Hộ gia đình", location: "Lâm Đồng", kwp: 10, savingPerMonth: 3_400_000, image: "/images/illustrations/home-solar-tall.webp",
    detail: "Hệ 10 kWp kết hợp sạc xe điện ban ngày, thiết kế khung thấp để giữ kiến trúc mái.", metrics: [["Công suất", "10 kWp"], ["Sạc xe điện", "Có"], ["Thi công", "2 ngày"], ["Giảm hóa đơn", "~80%"]] },
  { slug: "khu-dan-cu-bac-ninh", title: "Cụm 12 hộ khu dân cư Bắc Ninh", segment: "household", type: "Khu dân cư", location: "Bắc Ninh", kwp: 60, savingPerMonth: 14_500_000, image: "/images/solar-panels-hero.jpg",
    detail: "Lắp đồng loạt cho 12 hộ cùng khu, mỗi hộ 5 kWp, giá ưu đãi khi đăng ký nhóm.", metrics: [["Tổng công suất", "60 kWp"], ["Số hộ", "12"], ["Thi công", "8 ngày"], ["Giám sát", "Từng hộ"]] },

  { slug: "sieu-thi-mini-can-tho", title: "Chuỗi siêu thị mini Cần Thơ", segment: "shop", type: "Chuỗi cửa hàng", location: "Cần Thơ", kwp: 45, savingPerMonth: 15_200_000, image: "/images/illustrations/shop-solar.webp",
    detail: "3 điểm bán, tủ mát và điều hòa chạy cả ngày. Theo dõi sản lượng cả chuỗi trên một ứng dụng.", metrics: [["Công suất", "3 × 15 kWp"], ["Tự dùng", "95%"], ["Thi công", "Ngoài giờ bán"], ["Giảm hóa đơn", "~40%"]] },
  { slug: "nha-hang-da-nang", title: "Nhà hàng hải sản Đà Nẵng", segment: "shop", type: "Nhà hàng", location: "Đà Nẵng", kwp: 25, savingPerMonth: 9_800_000, image: "/images/illustrations/shop-solar-tall.webp",
    detail: "Bếp và hệ thống làm lạnh tiêu thụ lớn ban ngày; hệ 25 kWp bù phần lớn điện giờ cao điểm.", metrics: [["Công suất", "25 kWp"], ["Tự dùng", "92%"], ["Thi công", "2 ngày"], ["Giảm hóa đơn", "~35%"]] },
  { slug: "showroom-ha-noi", title: "Showroom nội thất Hà Nội", segment: "shop", type: "Showroom", location: "Hà Nội", kwp: 18, savingPerMonth: 5_100_000, image: "/images/solar-inverter-hero.jpg",
    detail: "Mái tôn showroom 200 m², chiếu sáng và điều hòa trưng bày dùng điện ban ngày.", metrics: [["Công suất", "18 kWp"], ["Tự dùng", "90%"], ["Thi công", "1,5 ngày"], ["Giảm hóa đơn", "~38%"]] },

  { slug: "nha-may-phan-bon-dong-nai", title: "Nhà máy phân bón Đồng Nai", segment: "factory", type: "Nhà máy", location: "Đồng Nai", kwp: 998, savingPerMonth: 118_000_000, image: "/images/illustrations/factory-solar.webp",
    detail: "Hệ áp mái cho dây chuyền trộn và đóng bao chạy ban ngày. Thi công chia khu vực theo ca để không dừng sản xuất.", metrics: [["Công suất", "998 kWp"], ["Tự dùng", "91%"], ["CO₂ giảm", "~840 tấn/năm"], ["Thi công", "8 tuần"]] },
  { slug: "trai-ga-tay-ninh", title: "Trang trại gà Tây Ninh", segment: "factory", type: "Trang trại", location: "Tây Ninh", kwp: 320, savingPerMonth: 42_500_000, image: "/images/illustrations/farm-hybrid-solar.webp",
    detail: "Quạt hút, làm mát và chiếu sáng chuồng chạy liên tục. Hệ hybrid giữ điện cho tải quan trọng khi lưới gián đoạn.", metrics: [["Solar", "320 kWp"], ["Lưu trữ", "215 kWh"], ["Tải ưu tiên", "Quạt, bơm"], ["Giám sát", "24/7"]] },
  { slug: "kho-lanh-long-an", title: "Kho lạnh thủy sản", segment: "factory", type: "Kho lạnh", location: "Tây Ninh", kwp: 620, savingPerMonth: 77_500_000, image: "/images/illustrations/cold-storage-solar.webp",
    detail: "Tải lạnh ổn định giúp hệ thống bám sát nhu cầu điện ban ngày. Bố trí string theo vùng mái để dễ vệ sinh.", metrics: [["Công suất", "620 kWp"], ["Tự dùng", "95%"], ["Giảm mua điện lưới", "~38%"], ["Theo dõi", "Theo string"]] },
];
