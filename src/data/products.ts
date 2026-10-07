/**
 * SẢN PHẨM — trang /san-pham, dải sản phẩm trang chủ, mega menu "Thiết bị", giỏ yêu cầu báo giá.
 * - price / salePrice: VNĐ. salePrice chỉ hiển thị khi < price; nhãn "Giảm Y%" chỉ khi Y ≥ 5. Bỏ trống price → "Liên hệ".
 * - images: ảnh đầu là ảnh đại diện; các ảnh sau hiện trong "Xem nhanh" và trang chi tiết.
 * - powerKw: kW (tấm pin, inverter, đèn) hoặc kWh (pin lưu trữ, BESS) — dùng cho bộ lọc công suất (?minPower=&maxPower=).
 * - tech / segment: dùng cho chip lọc ở mega menu (?tech=&segment=).
 * - featured: true → dải sản phẩm trang chủ (tối đa 8). compatible: slug sản phẩm "combo tương thích".
 * [DỮ LIỆU MẪU] — tên hãng/model HƯ CẤU, ảnh minh họa tạo bằng scripts/make-catalog-images.js.
 */
export type ProductCategory = "panel" | "inverter" | "battery" | "allinone" | "bess" | "light" | "accessory";
/** Phân khúc dùng cho chip lọc ở mega menu "Thiết bị" (?segment=home|business|project). */
export type ProductSegment = "home" | "business" | "project";

export type Product = {
  slug: string;
  category: ProductCategory;
  brand: string;
  name: string;
  images: string[];
  powerKw: number;
  price?: number;
  salePrice?: number;
  unit?: string;
  warranty: string;
  datasheet?: string;
  tech: string[];
  segment: ProductSegment[];
  specs: Record<string, string>;
  compatible?: string[];
  featured?: boolean;
};

export const CATEGORIES: { value: ProductCategory; label: string; en: string }[] = [
  { value: "panel", label: "Tấm pin", en: "Panels" },
  { value: "inverter", label: "Inverter", en: "Inverters" },
  { value: "battery", label: "Pin lưu trữ", en: "Batteries" },
  { value: "allinone", label: "All-in-one", en: "All-in-one" },
  { value: "bess", label: "BESS", en: "BESS" },
  { value: "light", label: "Đèn năng lượng mặt trời", en: "Solar lights" },
  { value: "accessory", label: "Phụ kiện", en: "Accessories" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<ProductCategory, string>;
export const PRODUCT_SEGMENT_LABELS: Record<ProductSegment, string> = { home: "Hộ gia đình", business: "Doanh nghiệp", project: "Dự án / nhà xưởng" };

/** Khoảng giá trên trang /san-pham (?gia=…). Sản phẩm "Liên hệ" chỉ hiện khi không lọc giá. */
export const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: "duoi-1tr", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { value: "1-5tr", label: "1 – 5 triệu", min: 1_000_000, max: 5_000_000 },
  { value: "5-50tr", label: "5 – 50 triệu", min: 5_000_000, max: 50_000_000 },
  { value: "tren-50tr", label: "Trên 50 triệu", min: 50_000_000, max: Infinity },
];

const img = (name: string) => `/images/catalog/${name}.svg`;

export const PRODUCTS: Product[] = [
  // ---- Tấm pin ----
  { slug: "helionyx-nova-n-590w", category: "panel", brand: "Helionyx", name: "Tấm pin Nova N-type 590W", images: [img("panel-ntype")], powerKw: 0.59, price: 3_450_000, salePrice: 3_150_000, unit: "tấm", warranty: "12 năm sản phẩm • 30 năm hiệu suất", datasheet: "#", tech: ["N-type TOPCon"], segment: ["home", "business"], featured: true,
    specs: { "Công suất": "590 W", "Công nghệ": "N-type TOPCon", "Hiệu suất": "22,8%", "Kích thước": "2278 × 1134 mm", "Khối lượng": "27,5 kg" }, compatible: ["voltaris-vh-10k", "kinetra-kx-50k"] },
  { slug: "helionyx-titan-bi-620w", category: "panel", brand: "Helionyx", name: "Tấm pin 2 mặt kính Titan 620W", images: [img("panel-bifacial")], powerKw: 0.62, unit: "tấm", warranty: "15 năm sản phẩm • 30 năm hiệu suất", datasheet: "#", tech: ["N-type TOPCon", "Bifacial"], segment: ["project"],
    specs: { "Công suất": "620 W", "Công nghệ": "TOPCon hai mặt kính", "Hiệu suất": "22,9%", "Ứng dụng": "Nhà xưởng, trang trại, mặt đất", "Kiểu cell": "Half-cut" }, compatible: ["kinetra-kx-110k"] },
  { slug: "solvane-hjt-600w", category: "panel", brand: "Solvane", name: "Tấm pin HJT Pro 600W", images: [img("panel-bifacial")], powerKw: 0.6, price: 3_690_000, unit: "tấm", warranty: "12 năm sản phẩm • 30 năm hiệu suất", datasheet: "#", tech: ["HJT", "Bifacial"], segment: ["business", "project"],
    specs: { "Công suất": "600 W", "Công nghệ": "HJT", "Hiệu suất": "23,1%", "Ứng dụng": "Doanh nghiệp, nhà xưởng", "Kiểu cell": "Half-cut" }, compatible: ["kinetra-kx-50k"] },
  { slug: "lumora-mono-450w", category: "panel", brand: "Lumora", name: "Tấm pin Mono Black 450W", images: [img("panel-mono")], powerKw: 0.45, price: 2_450_000, salePrice: 2_390_000, unit: "tấm", warranty: "12 năm sản phẩm • 25 năm hiệu suất", datasheet: "#", tech: ["P-type PERC"], segment: ["home"],
    specs: { "Công suất": "450 W", "Công nghệ": "Mono PERC full black", "Hiệu suất": "21,3%", "Kích thước": "2094 × 1038 mm", "Phù hợp": "Nhà phố, biệt thự" }, compatible: ["voltaris-vg-5k"] },

  // ---- Inverter ----
  { slug: "voltaris-vg-5k", category: "inverter", brand: "Voltaris", name: "Inverter hòa lưới VG-5K 1 pha", images: [img("inverter-grid")], powerKw: 5, price: 16_900_000, unit: "bộ", warranty: "10 năm", datasheet: "#", tech: ["On-grid"], segment: ["home"], featured: true,
    specs: { "Công suất AC": "5 kW", "Pha": "1 pha", "MPPT": "2", "Hiệu suất": "98,4%", "Giám sát": "Wi-Fi + ứng dụng" }, compatible: ["lumora-mono-450w"] },
  { slug: "voltaris-vh-10k", category: "inverter", brand: "Voltaris", name: "Inverter hybrid VH-10K 3 pha", images: [img("inverter-hybrid"), img("battery-10")], powerKw: 10, price: 42_500_000, salePrice: 39_900_000, unit: "bộ", warranty: "5 năm tiêu chuẩn", datasheet: "#", tech: ["Hybrid"], segment: ["home", "business"], featured: true,
    specs: { "Công suất": "10 kW", "Kiểu": "Hybrid 3 pha", "Chuyển mạch dự phòng": "< 10 ms", "MPPT": "2", "Pin tương thích": "LFP điện áp cao" }, compatible: ["litheon-hv-10", "cellora-wall-5"] },
  { slug: "kinetra-kx-50k", category: "inverter", brand: "Kinetra", name: "Inverter hòa lưới KX-50K", images: [img("inverter-3phase")], powerKw: 50, price: 68_500_000, salePrice: 69_900_000, unit: "bộ", warranty: "5 năm tiêu chuẩn", datasheet: "#", tech: ["On-grid"], segment: ["business", "project"],
    specs: { "Công suất AC": "50 kW", "Pha": "3 pha", "MPPT": "4", "Bảo vệ": "IP65", "Giám sát": "Cloud" }, compatible: ["helionyx-nova-n-590w", "solvane-hjt-600w"] },
  { slug: "kinetra-kx-110k", category: "inverter", brand: "Kinetra", name: "Inverter hòa lưới KX-110K", images: [img("inverter-3phase")], powerKw: 110, unit: "bộ", warranty: "5 năm, tùy chọn mở rộng", datasheet: "#", tech: ["On-grid"], segment: ["project"],
    specs: { "Công suất AC": "110 kW", "MPPT": "10", "Hiệu suất cực đại": "98,8%", "Bảo vệ": "IP66 / C5", "Ứng dụng": "Nhà xưởng" }, compatible: ["helionyx-titan-bi-620w"] },

  // ---- Pin lưu trữ ----
  { slug: "cellora-wall-5", category: "battery", brand: "Cellora", name: "Pin lưu trữ PowerWall LFP 5 kWh", images: [img("battery-5")], powerKw: 5.1, price: 32_000_000, salePrice: 29_500_000, unit: "khối", warranty: "10 năm", datasheet: "#", tech: ["LiFePO4"], segment: ["home"], featured: true,
    specs: { "Dung lượng": "5,12 kWh", "Hóa học": "LiFePO4", "Điện áp": "51,2 V", "Chu kỳ": "≥ 6.000", "Lắp đặt": "Treo tường / xếp chồng" }, compatible: ["voltaris-vh-10k"] },
  { slug: "litheon-hv-10", category: "battery", brand: "Litheon", name: "Pin lưu trữ HV Stack 10 kWh", images: [img("battery-10"), img("battery-15")], powerKw: 10.2, unit: "bộ", warranty: "10 năm theo điều kiện hãng", datasheet: "#", tech: ["LiFePO4", "High Voltage"], segment: ["home", "business"],
    specs: { "Dung lượng": "10,24 kWh", "Hóa học": "LiFePO4", "Mở rộng": "Tới 30 kWh", "Điện áp": "High Voltage", "BMS": "Tích hợp" }, compatible: ["voltaris-vh-10k"] },

  // ---- All-in-one & BESS ----
  { slug: "kinetra-aio-8", category: "allinone", brand: "Kinetra", name: "Tủ All-in-one 8 kW / 10 kWh", images: [img("allinone-8"), img("battery-10")], powerKw: 8, price: 96_000_000, unit: "bộ", warranty: "5 năm inverter • 10 năm pin", datasheet: "#", tech: ["Hybrid", "LiFePO4"], segment: ["home"],
    specs: { "Inverter": "8 kW hybrid", "Pin": "10 kWh LiFePO4", "Thiết kế": "Tủ tích hợp", "Dự phòng": "< 10 ms", "Phù hợp": "Nhà phố, biệt thự" }, compatible: ["helionyx-nova-n-590w"] },
  { slug: "ferrovolt-cube-215", category: "bess", brand: "Ferrovolt", name: "BESS Cube 100 kW / 215 kWh", images: [img("bess-215")], powerKw: 215, unit: "tủ", warranty: "10 năm / 6.000 chu kỳ (mẫu)", datasheet: "#", tech: ["LiFePO4", "Outdoor cabinet"], segment: ["business", "project"],
    specs: { "Công suất": "100 kW", "Dung lượng": "215 kWh", "Làm mát": "Chất lỏng", "Bảo vệ": "IP55", "Ứng dụng": "Cắt đỉnh, dự phòng tải" }, compatible: ["kinetra-kx-110k"] },

  // ---- Đèn năng lượng mặt trời ----
  { slug: "den-pha-100w", category: "light", brand: "Lumivolt Light", name: "Đèn pha năng lượng mặt trời 100W", images: [img("light-flood-100")], powerKw: 0.1, price: 650_000, salePrice: 520_000, unit: "bộ", warranty: "2 năm", tech: ["Đèn pha"], segment: ["home", "business"], featured: true,
    specs: { "Công suất": "100 W", "Tấm pin": "6V 15W rời", "Pin": "LFP 10.000 mAh", "Thời gian sáng": "10–12 giờ", "Chống nước": "IP67" } },
  { slug: "den-pha-300w", category: "light", brand: "Lumivolt Light", name: "Đèn pha năng lượng mặt trời 300W", images: [img("light-flood-300")], powerKw: 0.3, price: 1_250_000, salePrice: 1_190_000, unit: "bộ", warranty: "2 năm", tech: ["Đèn pha"], segment: ["business", "project"], featured: true,
    specs: { "Công suất": "300 W", "Tấm pin": "6V 30W rời", "Pin": "LFP 25.000 mAh", "Thời gian sáng": "12 giờ", "Phù hợp": "Sân, kho, trang trại" } },
  { slug: "den-duong-200w", category: "light", brand: "Lumivolt Light", name: "Đèn đường liền thể 200W", images: [img("light-street")], powerKw: 0.2, price: 1_850_000, unit: "bộ", warranty: "3 năm", tech: ["Đèn đường"], segment: ["business", "project"], featured: true,
    specs: { "Công suất": "200 W", "Kiểu": "Liền thể (pin + đèn)", "Cảm biến": "Chuyển động + ánh sáng", "Chiều cao lắp": "4–6 m", "Chống nước": "IP66" } },
  { slug: "den-san-vuon-bo-4", category: "light", brand: "Lumivolt Light", name: "Đèn sân vườn cắm cỏ (bộ 4)", images: [img("light-garden")], powerKw: 0.01, price: 420_000, unit: "bộ", warranty: "1 năm", tech: ["Sân vườn"], segment: ["home"],
    specs: { "Số đèn": "4", "Ánh sáng": "Vàng ấm 3000K", "Thời gian sáng": "8–10 giờ", "Lắp đặt": "Cắm đất, không đi dây", "Chống nước": "IP65" } },

  // ---- Phụ kiện ----
  { slug: "connecta-mc4-kit", category: "accessory", brand: "Connecta", name: "Bộ cáp DC 4 mm² + đầu nối MC4", images: [img("acc-mc4")], powerKw: 0, price: 390_000, unit: "bộ", warranty: "Theo lô hàng", tech: ["MC4", "DC cable"], segment: ["home", "business", "project"], featured: true,
    specs: { "Tiết diện": "4 mm²", "Chiều dài": "10 m", "Đầu nối": "MC4 IP68", "Chịu UV": "Có", "Ứng dụng": "Chuỗi DC" } },
  { slug: "connecta-pv-cable-6", category: "accessory", brand: "Connecta", name: "Cáp DC PV 6 mm² (cuộn 100 m)", images: [img("acc-mc4")], powerKw: 0, price: 2_850_000, unit: "cuộn", warranty: "Theo lô hàng", tech: ["DC cable"], segment: ["business", "project"],
    specs: { "Tiết diện": "6 mm²", "Chuẩn": "EN 50618 (mẫu)", "Vỏ": "XLPO chống UV", "Chiều dài": "100 m" } },
  { slug: "khung-nhom-mai-ton", category: "accessory", brand: "Lumivolt", name: "Khung nhôm mái tôn (cho 4 tấm)", images: [img("acc-rail")], powerKw: 0, price: 1_600_000, salePrice: 1_450_000, unit: "bộ", warranty: "10 năm", tech: ["Khung"], segment: ["home", "business", "project"],
    specs: { "Vật liệu": "Nhôm 6005-T5", "Kẹp": "Inox SUS304", "Mái phù hợp": "Tôn sóng, tôn cliplock", "Tải gió": "Theo TCVN 2737" } },
];

/** Sản phẩm nổi bật cho trang chủ: tối đa 8, mỗi sản phẩm một lần. */
export const featuredProducts = (limit = 8) =>
  PRODUCTS.filter((p, i, all) => p.featured && all.findIndex((q) => q.slug === p.slug) === i).slice(0, limit);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** Hãng thiết bị (bộ lọc catalog, dải thương hiệu). */
export const productBrands = () => Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();
