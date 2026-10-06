/**
 * SỐ LIỆU DỰ TOÁN ĐIỆN MẶT TRỜI — mọi con số của công cụ dự toán nằm ở file này.
 * Component không được viết cứng giá/hệ số; muốn chỉnh chỉ cần sửa ở đây.
 *
 * ⚠️ Các giá trị dưới đây là GIÁ TRỊ MẪU để demo. Chủ dự án phải xác minh trước khi xuất bản.
 */

export type Segment = "household" | "shop" | "factory";
export type Region = "bac-bo" | "bac-trung-bo" | "nam-trung-bo" | "tay-nguyen" | "nam-bo";

export const SEGMENTS: Record<Segment, { label: string; short: string; defaultDaytimeRatio: number }> = {
  household: { label: "Hộ gia đình", short: "Hộ gia đình", defaultDaytimeRatio: 40 },
  shop: { label: "Cửa hàng", short: "Cửa hàng", defaultDaytimeRatio: 70 },
  factory: { label: "Nhà xưởng / Trang trại", short: "Nhà xưởng", defaultDaytimeRatio: 80 },
};

export const SEGMENT_ORDER: Segment[] = ["household", "shop", "factory"];

/** Bậc thang: `upTo` = kWh cộng dồn tối đa của bậc (null = không giới hạn), `price` = đ/kWh chưa VAT. */
export type Tier = { upTo: number | null; price: number };

export type Tariff =
  | { kind: "tiered"; tiers: Tier[] }
  /** averageRate: giá bình quân để quy đổi hóa đơn → kWh; solarOffsetRate: giá của kWh mà điện mặt trời thay thế (giờ ban ngày). */
  | { kind: "flat"; averageRate: number; solarOffsetRate: number };

export const TARIFFS: Record<Segment, Tariff> = {
  // TODO: XÁC MINH VỚI BIỂU GIÁ EVN HIỆN HÀNH — giá điện sinh hoạt bậc thang (đ/kWh, chưa VAT),
  // giá trị mẫu theo biểu giá áp dụng từ 10/05/2025.
  household: {
    kind: "tiered",
    tiers: [
      { upTo: 50, price: 1984 },
      { upTo: 100, price: 2050 },
      { upTo: 200, price: 2380 },
      { upTo: 300, price: 2998 },
      { upTo: 400, price: 3350 },
      { upTo: null, price: 3460 },
    ],
  },
  // TODO: XÁC MINH VỚI BIỂU GIÁ EVN HIỆN HÀNH — giá kinh doanh, cấp điện áp dưới 6 kV.
  // averageRate = bình quân 3 khung giờ theo cơ cấu tiêu thụ điển hình của cửa hàng.
  shop: { kind: "flat", averageRate: 3300, solarOffsetRate: 3150 },
  // TODO: XÁC MINH VỚI BIỂU GIÁ EVN HIỆN HÀNH — giá sản xuất, cấp điện áp 6–22 kV.
  factory: { kind: "flat", averageRate: 2050, solarOffsetRate: 1900 },
};

/** Thuế GTGT cộng vào hóa đơn. TODO: XÁC MINH mức VAT hiện hành (8% hay 10%). */
export const VAT_RATE = 0.08;

/** Đơn giá trọn gói (đ/kWp, đã gồm thiết bị + thi công). TODO: XÁC MINH VỚI BẢNG GIÁ CỦA CÔNG TY. */
export const PRICE_PER_KWP: Record<Segment, number> = {
  household: 12_000_000,
  shop: 11_000_000,
  factory: 9_500_000,
};

export const SYSTEM = {
  /** Performance ratio — tổn hao nhiệt, dây dẫn, inverter, bụi bẩn. */
  performanceRatio: 0.8,
  /** Diện tích mái cần cho 1 kWp (m²). */
  m2PerKwp: 5.5,
  /** Công suất 1 tấm pin (W). */
  panelWatt: 580,
  /** Bước làm tròn công suất đề xuất (kWp). */
  kwpStep: 0.5,
  /** Công suất tối thiểu đề xuất (kWp). */
  minKwp: 1,
  /** Diện tích mái tối thiểu nhập vào (m²). */
  minRoofArea: 16,
};

/**
 * Giờ nắng đỉnh trung bình (kWh/m²/ngày ≈ giờ). GIÁ TRỊ ƯỚC TÍNH — cần hiệu chỉnh theo dữ liệu
 * bức xạ thực tế (Global Solar Atlas, PVGIS…) hoặc số liệu vận hành của công ty.
 */
export const PEAK_SUN_HOURS: Record<Region, number> = {
  "bac-bo": 3.5,
  "bac-trung-bo": 4.0,
  "nam-trung-bo": 4.8,
  "tay-nguyen": 4.8,
  "nam-bo": 4.6,
};

export const REGION_LABELS: Record<Region, string> = {
  "bac-bo": "Bắc Bộ",
  "bac-trung-bo": "Bắc Trung Bộ",
  "nam-trung-bo": "Nam Trung Bộ",
  "tay-nguyen": "Tây Nguyên",
  "nam-bo": "Nam Bộ",
};

/** 34 tỉnh/thành sau sắp xếp đơn vị hành chính 2025. */
export const PROVINCES: { name: string; region: Region }[] = [
  ...["Hà Nội", "Hải Phòng", "Quảng Ninh", "Cao Bằng", "Lạng Sơn", "Lai Châu", "Điện Biên", "Sơn La", "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Ninh Bình"].map((name) => ({ name, region: "bac-bo" as const })),
  ...["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Trị", "Huế"].map((name) => ({ name, region: "bac-trung-bo" as const })),
  ...["Đà Nẵng", "Quảng Ngãi", "Khánh Hòa"].map((name) => ({ name, region: "nam-trung-bo" as const })),
  ...["Gia Lai", "Đắk Lắk", "Lâm Đồng"].map((name) => ({ name, region: "tay-nguyen" as const })),
  ...["TP Hồ Chí Minh", "Đồng Nai", "Tây Ninh", "Cần Thơ", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang"].map((name) => ({ name, region: "nam-bo" as const })),
];

/** Giới hạn & mặc định cho ô nhập hóa đơn (VNĐ/tháng). */
export const BILL_INPUT: Record<Segment, { min: number; max: number; step: number; default: number }> = {
  household: { min: 500_000, max: 20_000_000, step: 100_000, default: 2_000_000 },
  shop: { min: 1_000_000, max: 100_000_000, step: 500_000, default: 8_000_000 },
  factory: { min: 10_000_000, max: 2_000_000_000, step: 5_000_000, default: 80_000_000 },
};

export const ROOF_INPUT: Record<Segment, { default: number; max: number }> = {
  household: { default: 50, max: 500 },
  shop: { default: 120, max: 2_000 },
  factory: { default: 2_000, max: 50_000 },
};

export const DEFAULT_PROVINCE = "TP Hồ Chí Minh";
