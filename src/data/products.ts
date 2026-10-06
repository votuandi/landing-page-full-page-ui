/**
 * SẢN PHẨM (trang /san-pham, dải sản phẩm trang chủ, giỏ yêu cầu báo giá).
 * - price / salePrice: VNĐ. salePrice chỉ hiển thị khi < price; nhãn "Giảm Y%" chỉ khi Y ≥ 5. Bỏ trống price → "Liên hệ".
 * - featured: true → xuất hiện ở dải sản phẩm trang chủ (tối đa 8, mỗi sản phẩm 1 lần).
 * - images: ảnh đầu tiên là ảnh đại diện; các ảnh sau hiện trong "Xem nhanh".
 * [DỮ LIỆU MẪU] — ảnh minh họa tạo bằng scripts/make-catalog-images.js; giá, thông số cần thay bằng dữ liệu thật.
 */
export type ProductCategory = "panel" | "inverter" | "battery" | "light" | "accessory";

export type Product = {
  sku: string;
  category: ProductCategory;
  brand: string;
  name: string;
  images: string[];
  price?: number;
  salePrice?: number;
  unit?: string;
  warranty: string;
  specs: Record<string, string>;
  featured?: boolean;
};

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "panel", label: "Tấm pin" },
  { value: "inverter", label: "Inverter" },
  { value: "battery", label: "Pin lưu trữ" },
  { value: "light", label: "Đèn năng lượng mặt trời" },
  { value: "accessory", label: "Phụ kiện" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<ProductCategory, string>;

/** Khoảng giá trên trang /san-pham (VNĐ). Sản phẩm "Liên hệ" chỉ hiện khi không lọc giá. */
export const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: "duoi-1tr", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { value: "1-5tr", label: "1 – 5 triệu", min: 1_000_000, max: 5_000_000 },
  { value: "5-20tr", label: "5 – 20 triệu", min: 5_000_000, max: 20_000_000 },
  { value: "tren-20tr", label: "Trên 20 triệu", min: 20_000_000, max: Infinity },
];

const img = (name: string) => `/images/catalog/${name}.svg`;

export const PRODUCTS: Product[] = [
  { sku: "pin-jinko-580", category: "panel", brand: "JinkoSolar", name: "Tấm pin Tiger Neo N-type 580W", images: [img("panel-ntype")], price: 3_450_000, salePrice: 3_150_000, unit: "tấm", warranty: "12 năm sản phẩm • 30 năm hiệu suất", featured: true,
    specs: { "Công suất": "580 W", "Công nghệ": "N-type TOPCon", "Hiệu suất": "22,5%", "Kích thước": "2278 × 1134 mm", "Khối lượng": "27,5 kg" } },
  { sku: "pin-longi-450", category: "panel", brand: "LONGi", name: "Tấm pin Hi-MO mono 450W", images: [img("panel-mono")], price: 2_450_000, salePrice: 2_390_000, unit: "tấm", warranty: "12 năm sản phẩm • 25 năm hiệu suất",
    specs: { "Công suất": "450 W", "Công nghệ": "Mono PERC half-cut", "Hiệu suất": "20,7%", "Kích thước": "2094 × 1038 mm", "Phù hợp": "Mái nhà ở" } },
  { sku: "pin-trina-620", category: "panel", brand: "Trina Solar", name: "Tấm pin 2 mặt Vertex N 620W", images: [img("panel-bifacial")], unit: "tấm", warranty: "12 năm sản phẩm • 30 năm hiệu suất",
    specs: { "Công suất": "620 W", "Công nghệ": "N-type bifacial", "Hiệu suất": "23%", "Kính": "2 lớp kính", "Phù hợp": "Nhà xưởng, trang trại" } },

  { sku: "inv-huawei-5", category: "inverter", brand: "Huawei", name: "Inverter hòa lưới SUN2000 5kW", images: [img("inverter-grid")], price: 16_900_000, unit: "bộ", warranty: "10 năm", featured: true,
    specs: { "Công suất AC": "5 kW", "Pha": "1 pha", "MPPT": "2", "Hiệu suất": "98,4%", "Giám sát": "Ứng dụng FusionSolar" } },
  { sku: "inv-deye-6-hybrid", category: "inverter", brand: "Deye", name: "Inverter hybrid 6kW có lưu trữ", images: [img("inverter-hybrid"), img("battery-10")], price: 28_500_000, salePrice: 25_900_000, unit: "bộ", warranty: "5 năm", featured: true,
    specs: { "Công suất AC": "6 kW", "Kiểu": "Hybrid 1 pha", "Pin tương thích": "LFP 48V", "Chuyển mạch dự phòng": "< 4 ms", "Giám sát": "Wi-Fi" } },
  { sku: "inv-sungrow-20", category: "inverter", brand: "Sungrow", name: "Inverter 3 pha SG20RT 20kW", images: [img("inverter-3phase")], unit: "bộ", warranty: "10 năm",
    specs: { "Công suất AC": "20 kW", "Pha": "3 pha", "MPPT": "2", "Bảo vệ": "IP65", "Phù hợp": "Cửa hàng, xưởng nhỏ" } },

  { sku: "bat-pylon-5", category: "battery", brand: "Pylontech", name: "Pin lưu trữ LFP 5 kWh", images: [img("battery-5")], price: 32_000_000, salePrice: 29_500_000, unit: "khối", warranty: "10 năm", featured: true,
    specs: { "Dung lượng": "5,12 kWh", "Hóa học": "LiFePO4", "Điện áp": "51,2 V", "Chu kỳ": "≥ 6.000", "Lắp đặt": "Treo tường / xếp chồng" } },
  { sku: "bat-byd-10", category: "battery", brand: "BYD", name: "Pin lưu trữ LFP 10 kWh", images: [img("battery-10"), img("battery-15")], unit: "bộ", warranty: "10 năm",
    specs: { "Dung lượng": "10,24 kWh", "Hóa học": "LiFePO4", "Mở rộng": "Tới 30 kWh", "BMS": "Tích hợp", "Phù hợp": "Hybrid gia đình, cửa hàng" } },

  { sku: "den-pha-100", category: "light", brand: "Minwy Light", name: "Đèn pha năng lượng mặt trời 100W", images: [img("light-flood-100")], price: 650_000, salePrice: 520_000, unit: "bộ", warranty: "2 năm", featured: true,
    specs: { "Công suất": "100 W", "Tấm pin": "6V 15W rời", "Pin": "LFP 10.000 mAh", "Thời gian sáng": "10–12 giờ", "Chống nước": "IP67", "Điều khiển": "Remote + cảm biến tối" } },
  { sku: "den-pha-300", category: "light", brand: "Minwy Light", name: "Đèn pha năng lượng mặt trời 300W", images: [img("light-flood-300")], price: 1_250_000, salePrice: 1_190_000, unit: "bộ", warranty: "2 năm", featured: true,
    specs: { "Công suất": "300 W", "Tấm pin": "6V 30W rời", "Pin": "LFP 25.000 mAh", "Thời gian sáng": "12 giờ", "Chống nước": "IP67", "Phù hợp": "Sân, kho, trang trại" } },
  { sku: "den-duong-200", category: "light", brand: "Minwy Light", name: "Đèn đường liền thể 200W", images: [img("light-street")], price: 1_850_000, unit: "bộ", warranty: "3 năm", featured: true,
    specs: { "Công suất": "200 W", "Kiểu": "Liền thể (pin + đèn)", "Cảm biến": "Chuyển động + ánh sáng", "Chiều cao lắp": "4–6 m", "Chống nước": "IP66" } },
  { sku: "den-san-vuon", category: "light", brand: "Minwy Light", name: "Đèn sân vườn cắm cỏ (bộ 4)", images: [img("light-garden")], price: 420_000, unit: "bộ", warranty: "1 năm",
    specs: { "Số đèn": "4", "Ánh sáng": "Vàng ấm 3000K", "Thời gian sáng": "8–10 giờ", "Lắp đặt": "Cắm đất, không đi dây", "Chống nước": "IP65" } },

  { sku: "pk-mc4-cap", category: "accessory", brand: "Stäubli", name: "Bộ cáp DC 4mm² + đầu nối MC4", images: [img("acc-mc4")], price: 390_000, unit: "bộ", warranty: "Theo lô hàng", featured: true,
    specs: { "Tiết diện": "4 mm²", "Chiều dài": "10 m", "Đầu nối": "MC4 IP68", "Chịu UV": "Có", "Ứng dụng": "Chuỗi DC" } },
  { sku: "pk-khung-nhom", category: "accessory", brand: "Minwy", name: "Khung nhôm mái tôn (cho 4 tấm)", images: [img("acc-rail")], price: 1_600_000, salePrice: 1_450_000, unit: "bộ", warranty: "10 năm",
    specs: { "Vật liệu": "Nhôm 6005-T5", "Kẹp": "Inox SUS304", "Mái phù hợp": "Tôn sóng, tôn cliplock", "Tải gió": "Theo TCVN 2737" } },
];

/** Sản phẩm nổi bật cho trang chủ: tối đa 8, mỗi sku một lần. */
export const featuredProducts = (limit = 8) =>
  PRODUCTS.filter((p, i, all) => p.featured && all.findIndex((q) => q.sku === p.sku) === i).slice(0, limit);

export const productBySku = (sku: string) => PRODUCTS.find((p) => p.sku === sku);

/** Hãng thiết bị đang phân phối (dải logo ở khối uy tín). */
export const productBrands = () => Array.from(new Set(PRODUCTS.map((p) => p.brand))).filter((b) => !b.startsWith("Minwy"));
