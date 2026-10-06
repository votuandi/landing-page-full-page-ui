import type { Segment } from "@/config/solar";

/**
 * GÓI GIẢI PHÁP hiển thị ở trang chủ — tối đa 4 gói mỗi phân khúc (gói thứ 5 trở đi bị bỏ qua).
 * price / salePrice: VNĐ. salePrice chỉ hiển thị khi nhỏ hơn price.
 * Tiền tiết kiệm/tháng tự tính từ config/solar.ts theo PACKAGE_REFERENCE_PROVINCE.
 * [DỮ LIỆU MẪU] — TODO: thay bằng bảng giá thật của công ty.
 */
export type SolarPackage = {
  id: string;
  segment: Segment;
  name: string;
  kwp: number;
  price: number;
  salePrice?: number;
  suitableFor: string;
  highlights: string[];
  popular?: boolean;
};

/** Tỉnh dùng làm mốc để tính "Giảm ~X triệu/tháng" trên thẻ gói. */
export const PACKAGE_REFERENCE_PROVINCE = "TP Hồ Chí Minh";

export const MAX_PACKAGES_PER_SEGMENT = 4;

export const PACKAGES: SolarPackage[] = [
  { id: "hgd-3", segment: "household", name: "Gói Tiết kiệm", kwp: 3, price: 39_000_000, salePrice: 36_000_000, suitableFor: "Tiền điện 1–1,5 triệu/tháng", highlights: ["6 tấm pin 580W", "Inverter hòa lưới 3 kW", "Theo dõi qua app"] },
  { id: "hgd-5", segment: "household", name: "Gói Gia đình", kwp: 5.5, price: 66_000_000, salePrice: 62_000_000, suitableFor: "Tiền điện 2–3 triệu/tháng", highlights: ["10 tấm pin 580W", "Inverter hybrid 5 kW", "Sẵn sàng gắn pin lưu trữ"], popular: true },
  { id: "hgd-8", segment: "household", name: "Gói Hybrid 8 kWp", kwp: 8, price: 128_000_000, suitableFor: "Nhà phố, biệt thự 3–5 triệu/tháng", highlights: ["14 tấm pin 580W", "Pin lưu trữ LFP 10 kWh", "Có điện khi mất điện lưới"] },
  { id: "hgd-12", segment: "household", name: "Gói Biệt thự", kwp: 12, price: 168_000_000, salePrice: 175_000_000, suitableFor: "Tiền điện từ 5 triệu/tháng", highlights: ["21 tấm pin 580W", "Inverter 3 pha 12 kW", "Sạc xe điện ban ngày"] },

  { id: "ch-10", segment: "shop", name: "Gói Cửa hàng", kwp: 10, price: 115_000_000, salePrice: 109_000_000, suitableFor: "Tạp hóa, quán ăn, salon", highlights: ["18 tấm pin 580W", "Thi công 1 ngày", "Không gián đoạn bán hàng"] },
  { id: "ch-20", segment: "shop", name: "Gói Showroom", kwp: 20, price: 220_000_000, suitableFor: "Showroom, phòng khám, văn phòng", highlights: ["35 tấm pin 580W", "Inverter 3 pha 20 kW", "Báo cáo tiết kiệm hằng tháng"], popular: true },
  { id: "ch-30", segment: "shop", name: "Gói Chuỗi cửa hàng", kwp: 30, price: 324_000_000, salePrice: 315_000_000, suitableFor: "Siêu thị mini, chuỗi điểm bán", highlights: ["52 tấm pin 580W", "Quản lý nhiều điểm trên 1 app", "Ưu đãi lắp đồng loạt"] },
  { id: "ch-hybrid", segment: "shop", name: "Gói Hybrid kinh doanh", kwp: 15, price: 210_000_000, suitableFor: "Cửa hàng cần điện dự phòng", highlights: ["26 tấm pin 580W", "Pin lưu trữ 15 kWh", "Giữ POS, camera, tủ đông khi mất điện"] },

  { id: "nx-100", segment: "factory", name: "Gói Xưởng 100 kWp", kwp: 100, price: 980_000_000, salePrice: 950_000_000, suitableFor: "Xưởng may, cơ khí nhỏ", highlights: ["173 tấm pin 580W", "Giám sát theo string", "Hồ sơ đấu nối trọn gói"] },
  { id: "nx-300", segment: "factory", name: "Gói Nhà máy 300 kWp", kwp: 300, price: 2_790_000_000, suitableFor: "Nhà máy phân bón, chế biến", highlights: ["518 tấm pin 580W", "Thi công theo ca, không dừng sản xuất", "O&M năm đầu miễn phí"], popular: true },
  { id: "nx-trai", segment: "factory", name: "Gói Trang trại", kwp: 150, price: 1_455_000_000, salePrice: 1_390_000_000, suitableFor: "Trại gà, trại heo, nhà kính", highlights: ["Ưu tiên quạt hút, bơm, chiếu sáng", "Khung chống ăn mòn môi trường chuồng trại", "Có tùy chọn pin lưu trữ"] },
  { id: "nx-esco", segment: "factory", name: "Gói 0 đồng (ESCO)", kwp: 500, price: 0, suitableFor: "Tiền điện từ 300 triệu/tháng", highlights: ["Nhà đầu tư bỏ vốn 100%", "Mua điện giá thấp hơn EVN", "Chuyển giao hệ thống cuối hợp đồng"] },
];

export const packagesFor = (segment: Segment) =>
  PACKAGES.filter((p) => p.segment === segment).slice(0, MAX_PACKAGES_PER_SEGMENT);
