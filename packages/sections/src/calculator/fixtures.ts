/**
 * [DỮ LIỆU MẪU] Dự toán t15 — chép từ apps/web/src/config/solar.ts. Giá điện, VAT, đơn giá, giờ nắng là GIÁ TRỊ MẪU,
 * chủ dự án phải xác minh (biểu giá EVN, bảng giá công ty, dữ liệu bức xạ) trước khi xuất bản.
 */
import type { z } from "zod";
import type { calculatorSchema } from "./schema";

export const calculatorFixture = {
  eyebrow: { vi: "Dự toán miễn phí", en: "Free estimate" },
  title: { lead: { vi: "Dự toán chi phí lắp đặt trong", en: "Estimate your installation in" }, highlight: { vi: "30 giây", en: "30 seconds" } },
  description: {
    vi: "Nhập tiền điện và diện tích mái để biết công suất phù hợp, số tấm pin, tiền tiết kiệm mỗi tháng và thời gian hoàn vốn.",
    en: "Enter your bill and roof area to see system size, panel count, monthly savings and payback.",
  },
  segments: [
    { segment: "household", label: { vi: "Hộ gia đình", en: "Households" }, short: { vi: "Hộ gia đình", en: "Homes" } },
    { segment: "shop", label: { vi: "Cửa hàng & chuỗi", en: "Shops & chains" }, short: { vi: "Cửa hàng", en: "Shops" } },
    { segment: "factory", label: { vi: "Nhà xưởng", en: "Factories" }, short: { vi: "Nhà xưởng", en: "Factories" } },
    { segment: "farm", label: { vi: "Trang trại", en: "Farms" }, short: { vi: "Trang trại", en: "Farms" } },
  ],
  tariffs: {
    // Sinh hoạt bậc thang (đ/kWh, chưa VAT), biểu giá mẫu từ 10/05/2025.
    household: { kind: "tiered", tiers: [
      { upTo: 50, price: 1984 }, { upTo: 100, price: 2050 }, { upTo: 200, price: 2380 },
      { upTo: 300, price: 2998 }, { upTo: 400, price: 3350 }, { upTo: null, price: 3460 },
    ] },
    shop: { kind: "flat", averageRate: 3300, solarOffsetRate: 3150 },
    factory: { kind: "flat", averageRate: 2050, solarOffsetRate: 1900 },
    farm: { kind: "flat", averageRate: 2250, solarOffsetRate: 2100 },
  },
  vatRate: 0.08,
  pricePerKwp: { household: 12_000_000, shop: 11_000_000, factory: 9_500_000, farm: 10_000_000 },
  peakSunHours: { "bac-bo": 3.5, "bac-trung-bo": 4.0, "nam-trung-bo": 4.8, "tay-nguyen": 4.8, "nam-bo": 4.6 },
  segmentRatios: { household: 40, shop: 70, factory: 80, farm: 70 },
  system: { performanceRatio: 0.8, m2PerKwp: 5.5, panelWatt: 580, kwpStep: 0.5, minKwp: 1, minRoofArea: 16 },
  inputs: {
    household: { bill: { min: 500_000, max: 20_000_000, step: 100_000, default: 2_000_000 }, roof: { default: 50, max: 500 } },
    shop: { bill: { min: 1_000_000, max: 100_000_000, step: 500_000, default: 8_000_000 }, roof: { default: 120, max: 2_000 } },
    factory: { bill: { min: 10_000_000, max: 2_000_000_000, step: 5_000_000, default: 80_000_000 }, roof: { default: 2_000, max: 50_000 } },
    farm: { bill: { min: 3_000_000, max: 500_000_000, step: 1_000_000, default: 25_000_000 }, roof: { default: 1_200, max: 30_000 } },
  },
  defaultProvince: "TP Hồ Chí Minh",
  steps: ["segment", "bill", "roof", "province", "ratio"],
  tips: [
    { vi: "Khảo sát tận nơi miễn phí", en: "Free on-site survey" },
    { vi: "Báo giá chi tiết trong 24 giờ", en: "Detailed quote in 24h" },
    { vi: "Trả góp 0% / lắp 0 đồng (ESCO)", en: "0% instalments / ESCO" },
  ],
  resultTitle: { vi: "Kết quả sơ bộ", en: "Preliminary result" },
  disclaimer: {
    vi: "Kết quả ước tính theo biểu giá và giờ nắng trung bình — chi phí thực tế xác định sau khảo sát.",
    en: "Estimate based on average tariffs and sun hours — final cost after site survey.",
  },
  formTitle: { vi: "Nhận báo giá chi tiết", en: "Get a detailed quote" },
  formDescription: { vi: "Gửi kèm toàn bộ thông số trên — kỹ sư gọi lại tư vấn miễn phí.", en: "All figures above are attached — an engineer will call you back for free." },
  ctaLabel: { vi: "Nhận báo giá chi tiết", en: "Get a detailed quote" },
  successText: { vi: "Kỹ sư sẽ gọi lại trong 2 giờ (trong giờ làm việc).", en: "An engineer will call you back within 2 hours (business hours)." },
  privacyNote: { vi: "Thông tin chỉ dùng để tư vấn & báo giá, không chia sẻ cho bên thứ ba.", en: "Your details are only used for consultation and quotes, never shared." },
  leadSource: "calculator",
} satisfies z.input<typeof calculatorSchema>;
