/**
 * [DỮ LIỆU MẪU] Gói giải pháp t15 (apps/web/src/data/packages.ts). Giá là mẫu; `monthlySaving` tính sẵn bằng
 * `estimateSavingForKwp` với tham số của fixture calculator, tại TP Hồ Chí Minh.
 */
import { estimateSavingForKwp, type Segment } from "@solar/core";
import type { z } from "zod";
import { calculatorFixture } from "../calculator/fixtures";
import { toCalculatorParams } from "../calculator/params";
import type { packagesSchema } from "./schema";

const params = toCalculatorParams(calculatorFixture as Parameters<typeof toCalculatorParams>[0]);
const saving = (segment: Segment, kwp: number) => Math.round(estimateSavingForKwp(segment, kwp, "TP Hồ Chí Minh", params));
const img = (id: string) => ({ id, alt: { vi: "" } });
const pkg = (id: string, segment: Segment, name: string, kwp: number, suitableFor: string, highlights: string[],
  extra: { price?: number; salePrice?: number; popular?: boolean } = {}) => ({
  id, segment, name: { vi: name }, kwp, suitableFor: { vi: suitableFor },
  highlights: highlights.map((vi) => ({ vi })), monthlySaving: saving(segment, kwp), ...extra,
});

export const packagesFixture = {
  eyebrow: { vi: "Gói giải pháp", en: "Solution packages" },
  title: { vi: "Chọn gói theo công trình, biết ngay tiền điện giảm bao nhiêu.", en: "Pick a package and see your monthly savings instantly." },
  segments: [
    { segment: "household", label: { vi: "Hộ gia đình", en: "Households" }, short: { vi: "Hộ gia đình", en: "Homes" }, pitch: { vi: "Cắt phần điện bậc 5–6 đắt nhất, có điện buổi tối với pin lưu trữ.", en: "Cut the priciest tariff tiers; keep the lights on at night with storage." }, cover: img("/images/illustrations/home-solar-tall.webp") },
    { segment: "shop", label: { vi: "Cửa hàng & chuỗi", en: "Shops & chains" }, short: { vi: "Cửa hàng", en: "Shops" }, pitch: { vi: "Giờ mở cửa trùng giờ nắng — điều hòa, tủ mát chạy bằng nắng.", en: "Opening hours match sun hours — AC and fridges run on sunshine." }, cover: img("/images/illustrations/shop-solar-tall.webp") },
    { segment: "factory", label: { vi: "Nhà xưởng", en: "Factories" }, short: { vi: "Nhà xưởng", en: "Factories" }, pitch: { vi: "Dây chuyền, quạt hút, tải lạnh chạy ban ngày — mái xưởng thành nhà máy điện riêng.", en: "Daytime lines and cooling loads — your roof becomes a power plant." }, cover: img("/images/illustrations/factory-solar-tall.webp") },
    { segment: "farm", label: { vi: "Trang trại", en: "Farms" }, short: { vi: "Trang trại", en: "Farms" }, pitch: { vi: "Quạt hút, bơm, làm mát chạy suốt ngày; pin lưu trữ giữ tải khi cúp điện.", en: "Fans, pumps and cooling all day; storage keeps them running in outages." }, cover: img("/images/illustrations/farm-hybrid-solar.webp") },
  ],
  defaultSegment: "household",
  items: [
    pkg("hgd-3", "household", "Gói Tiết kiệm", 3, "Tiền điện 1–1,5 triệu/tháng", ["6 tấm pin 580W", "Inverter hòa lưới 3 kW", "Theo dõi qua app"], { price: 39_000_000, salePrice: 36_000_000 }),
    pkg("hgd-5", "household", "Gói Gia đình", 5.5, "Tiền điện 2–3 triệu/tháng", ["10 tấm pin 580W", "Inverter hybrid 5 kW", "Sẵn sàng gắn pin lưu trữ"], { price: 66_000_000, popular: true }),
    pkg("hgd-8", "household", "Gói Hybrid", 8, "Nhà phố, biệt thự 3–5 triệu/tháng", ["14 tấm pin 580W", "Pin lưu trữ LFP 10 kWh", "Có điện khi mất điện lưới"], { price: 128_000_000, salePrice: 125_000_000 }),
    pkg("hgd-12", "household", "Gói Biệt thự", 12, "Tiền điện từ 5 triệu/tháng", ["21 tấm pin 580W", "Inverter 3 pha 12 kW", "Sạc xe điện ban ngày"]),
    pkg("ch-10", "shop", "Gói Cửa hàng", 10, "Tạp hóa, quán ăn, salon", ["18 tấm pin 580W", "Thi công 1 ngày", "Không gián đoạn bán hàng"], { price: 115_000_000, salePrice: 105_000_000 }),
    pkg("ch-20", "shop", "Gói Showroom", 20, "Showroom, phòng khám, văn phòng", ["35 tấm pin 580W", "Inverter 3 pha 20 kW", "Báo cáo tiết kiệm hằng tháng"], { price: 220_000_000, popular: true }),
    pkg("ch-30", "shop", "Gói Chuỗi cửa hàng", 30, "Siêu thị mini, chuỗi điểm bán", ["52 tấm pin 580W", "Quản lý nhiều điểm trên 1 app", "Ưu đãi lắp đồng loạt"], { price: 324_000_000 }),
    pkg("ch-hybrid", "shop", "Gói Hybrid kinh doanh", 15, "Cửa hàng cần điện dự phòng", ["26 tấm pin 580W", "Pin lưu trữ 15 kWh", "Giữ POS, camera, tủ đông khi mất điện"], { price: 210_000_000 }),
    pkg("nx-100", "factory", "Gói Xưởng 100 kWp", 100, "Xưởng may, cơ khí nhỏ", ["173 tấm pin 580W", "Giám sát theo string", "Hồ sơ đấu nối trọn gói"], { price: 980_000_000, salePrice: 950_000_000 }),
    pkg("nx-300", "factory", "Gói Nhà máy 300 kWp", 300, "Nhà máy chế biến, kho lạnh", ["518 tấm pin 580W", "Thi công theo ca, không dừng sản xuất", "Bảo trì năm đầu miễn phí"], { price: 2_790_000_000, popular: true }),
    pkg("nx-1mw", "factory", "Gói 1 MWp", 1000, "KCN, nhà máy tiền điện từ 300 triệu/tháng", ["Khảo sát kết cấu mái", "Có phương án đầu tư 0 đồng", "Giám sát 24/7"]),
    pkg("tt-30", "farm", "Gói Trại nhỏ", 30, "Trại gà, vịt quy mô hộ", ["52 tấm pin 580W", "Ưu tiên quạt hút, bơm nước", "Khung chống ăn mòn"], { price: 300_000_000, salePrice: 282_000_000 }),
    pkg("tt-80", "farm", "Gói Trang trại", 80, "Trại heo, gà 20.000–50.000 con", ["138 tấm pin 580W", "Lắp trên mái chuồng, nhà kho", "Báo cáo sản lượng theo ngày"], { price: 790_000_000, popular: true }),
    pkg("tt-hybrid", "farm", "Gói Hybrid trang trại", 120, "Trại cần điện dự phòng khi mất lưới", ["207 tấm pin 580W", "Pin lưu trữ 60 kWh", "Giữ quạt, hệ làm mát khi cúp điện"], { price: 1_380_000_000 }),
  ],
  maxPerSegment: 4,
  ctaLabel: { vi: "Nhận tư vấn gói này", en: "Get advice on this package" },
  savingLabel: { vi: "Giảm tiền điện", en: "Bill savings" },
  popularLabel: { vi: "Chọn nhiều", en: "Popular" },
  footnote: {
    vi: "* Tiết kiệm ước tính tại TP Hồ Chí Minh, giá trọn gói gồm thiết bị và thi công; báo giá chính thức sau khảo sát.",
    en: "* Savings estimated for Ho Chi Minh City; turnkey prices include equipment and installation. Final quote after survey.",
  },
} satisfies z.input<typeof packagesSchema>;
