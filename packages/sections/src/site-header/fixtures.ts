/** [DỮ LIỆU MẪU] Header t15 (apps/web/src/config/site.config.ts): thương hiệu, hotline, thương hiệu thiết bị là hư cấu. */
import type { z } from "zod";
import type { siteHeaderSchema } from "./schema";

const page = (value: string, vi: string, en: string) => ({ kind: "page" as const, value, label: { vi, en } });
const chip = (vi: string, en: string, bill?: number, popular = false) => ({ label: { vi, en }, bill, popular });
const equipment = (category: string, query: Record<string, string>, vi: string, en = vi) =>
  page(`san-pham?${new URLSearchParams({ category, ...query })}`, vi, en);

export const siteHeaderFixture = {
  brand: { name: "Lumivolt Energy" },
  topBar: [
    { vi: "Đầy đủ chứng từ VAT, CO, CQ cho mọi lô hàng", en: "Full VAT invoice, CO & CQ for every shipment" },
    { vi: "Cam kết hàng chính hãng 100%", en: "100% genuine products guaranteed" },
    { vi: "Hệ thống quản lý ISO 9001 · 14001 · 45001", en: "ISO 9001 · 14001 · 45001 management system" },
    { vi: "Chính sách đại lý chiết khấu tới 18%", en: "Dealer discounts up to 18%" },
    { vi: "Kỹ sư khảo sát miễn phí trong 48 giờ", en: "Free engineer site survey within 48 hours" },
  ],
  pricingMenu: {
    label: { vi: "Bảng giá lắp đặt", en: "Pricing" },
    hint: { vi: "Chọn mức → điền sẵn vào dự toán", en: "Pick a range → prefilled estimate" },
    categories: [
      { id: "ho-gia-dinh", label: { vi: "Hộ gia đình", en: "Households" }, hint: { vi: "Theo tiền điện/tháng", en: "By monthly bill" }, segment: "household", groups: [
        { title: { vi: "Không lưu trữ", en: "Grid-tied" }, chips: [chip("1 – 2 triệu", "1 – 2M VND", 1_500_000), chip("2 – 3 triệu", "2 – 3M VND", 2_500_000, true), chip("3 – 5 triệu", "3 – 5M VND", 4_000_000), chip("Trên 5 triệu", "Over 5M VND", 6_500_000)] },
        { title: { vi: "Có lưu trữ", en: "With battery" }, chips: [chip("2 – 3 triệu", "2 – 3M VND", 2_500_000), chip("3 – 5 triệu", "3 – 5M VND", 4_000_000, true), chip("Trên 5 triệu", "Over 5M VND", 6_500_000)] },
      ] },
      { id: "doanh-nghiep", label: { vi: "Doanh nghiệp", en: "Businesses" }, hint: { vi: "Văn phòng, cửa hàng, khách sạn", en: "Offices, shops, hotels" }, segment: "shop", groups: [
        { chips: [chip("5 – 15 triệu", "5 – 15M VND", 10_000_000), chip("15 – 30 triệu", "15 – 30M VND", 22_000_000, true), chip("30 – 60 triệu", "30 – 60M VND", 45_000_000), chip("Trên 60 triệu", "Over 60M VND", 80_000_000)] },
      ] },
      { id: "nha-xuong", label: { vi: "Nhà xưởng", en: "Factories" }, hint: { vi: "Sản xuất, kho lạnh, trang trại", en: "Manufacturing, cold storage, farms" }, segment: "factory", groups: [
        { chips: [chip("50 – 150 triệu", "50 – 150M VND", 100_000_000), chip("150 – 300 triệu", "150 – 300M VND", 220_000_000, true), chip("300 – 600 triệu", "300 – 600M VND", 450_000_000), chip("Trên 600 triệu", "Over 600M VND", 800_000_000)] },
      ] },
      { id: "bom-nuoc", label: { vi: "Bơm nước", en: "Water pumps" }, hint: { vi: "Theo công suất bơm (HP)", en: "By pump power (HP)" }, segment: "farm", groups: [
        { chips: [chip("1 HP", "1 HP", 500_000), chip("2 HP", "2 HP", 1_000_000), chip("3 HP", "3 HP", 1_500_000, true), chip("5 HP", "5 HP", 2_500_000), chip("7,5 HP", "7.5 HP", 3_800_000), chip("10 HP", "10 HP", 5_000_000)] },
      ] },
      { id: "om", label: { vi: "O&M" }, hint: { vi: "Vận hành & bảo trì theo MWp", en: "Operation & maintenance by MWp" }, segment: "factory", groups: [
        { chips: [chip("< 0,5 MWp", "< 0.5 MWp"), chip("0,5 – 1 MWp", "0.5 – 1 MWp", undefined, true), chip("1 – 3 MWp", "1 – 3 MWp"), chip("> 3 MWp", "> 3 MWp")] },
      ] },
      { id: "ve-sinh", label: { vi: "Vệ sinh", en: "Cleaning" }, hint: { vi: "Vệ sinh tấm pin định kỳ", en: "Periodic panel cleaning" }, segment: "shop", groups: [
        { chips: [chip("< 10 kWp", "< 10 kWp"), chip("10 – 50 kWp", "10 – 50 kWp", undefined, true), chip("50 – 200 kWp", "50 – 200 kWp"), chip("> 200 kWp", "> 200 kWp")] },
      ] },
    ],
  },
  menus: [
    { label: { vi: "Thiết bị", en: "Equipment" }, columns: [
      { title: { vi: "Tấm pin", en: "Solar panels" }, link: equipment("panel", {}, "Tấm pin", "Solar panels"), links: [equipment("panel", { tech: "N-type TOPCon" }, "N-type TOPCon"), equipment("panel", { tech: "Bifacial" }, "Hai mặt kính", "Bifacial"), equipment("panel", { minPower: "0.6" }, "≥ 600 W")] },
      { title: { vi: "Inverter" }, link: equipment("inverter", {}, "Inverter"), links: [equipment("inverter", { tech: "On-grid" }, "Hòa lưới", "On-grid"), equipment("inverter", { tech: "Hybrid" }, "Hybrid"), equipment("inverter", { minPower: "50" }, "≥ 50 kW")] },
      { title: { vi: "Lithium" }, link: equipment("battery", {}, "Lithium"), links: [equipment("battery", { tech: "LiFePO4" }, "LiFePO4"), equipment("battery", { tech: "High Voltage" }, "Điện áp cao", "High voltage"), equipment("battery", { minPower: "10" }, "≥ 10 kWh")] },
      { title: { vi: "BESS" }, link: equipment("bess", {}, "BESS"), links: [equipment("bess", { tech: "Outdoor cabinet" }, "Tủ ngoài trời", "Outdoor cabinet"), equipment("bess", { minPower: "200" }, "≥ 200 kWh")] },
    ] },
    { label: { vi: "Cẩm nang", en: "Guides" }, columns: [
      { title: { vi: "Thuật ngữ", en: "Glossary" }, description: { vi: "kWp, PR, MPPT, hybrid… giải thích dễ hiểu", en: "kWp, PR, MPPT, hybrid… explained" }, link: page("cam-nang", "Thuật ngữ", "Glossary"), links: [] },
      { title: { vi: "Biểu giá điện", en: "Electricity tariffs" }, description: { vi: "Bậc thang sinh hoạt, kinh doanh, sản xuất", en: "Residential, commercial and industrial rates" }, link: page("cam-nang", "Biểu giá điện", "Electricity tariffs"), links: [] },
      { title: { vi: "Hỏi đáp", en: "FAQ" }, description: { vi: "Câu hỏi thường gặp trước khi lắp", en: "Common questions before installing" }, link: page("cam-nang", "Hỏi đáp", "FAQ"), links: [] },
      { title: { vi: "Kinh nghiệm lắp đặt", en: "Blog" }, description: { vi: "Bài viết theo tình huống thực tế", en: "Real-life use cases" }, link: page("tin-tuc", "Kinh nghiệm lắp đặt", "Blog"), links: [] },
    ] },
  ],
  links: [
    { kind: "anchor", value: "du-an", label: { vi: "Dự án", en: "Projects" } },
    { kind: "anchor", value: "dai-ly", label: { vi: "Đại lý", en: "Dealers" } },
    page("tin-tuc", "Tin tức", "News"),
  ],
  mobileLinks: [
    page("san-pham", "Sản phẩm & thiết bị", "Products"),
    page("ve-chung-toi", "Về chúng tôi", "About us"),
    page("lien-he", "Liên hệ", "Contact"),
  ],
  hotlineLabel: { vi: "Hotline theo chi nhánh", en: "Hotlines by branch" },
  hotlines: [
    { name: "TP. Hồ Chí Minh", main: "0901 234 500", lines: [{ label: { vi: "Hộ gia đình", en: "Households" }, phone: "0901 234 501" }, { label: { vi: "Dự án", en: "Projects" }, phone: "0901 234 502" }],
      mapLink: { kind: "url", value: "https://www.google.com/maps/search/?api=1&query=10.7865,106.699", label: { vi: "Văn phòng trên Google Maps", en: "Office on Google Maps" } } },
    { name: "Hà Nội", main: "0901 234 520", lines: [{ label: { vi: "Hộ gia đình", en: "Households" }, phone: "0901 234 521" }, { label: { vi: "Dự án", en: "Projects" }, phone: "0901 234 522" }],
      mapLink: { kind: "url", value: "https://www.google.com/maps/search/?api=1&query=21.03,105.8", label: { vi: "Văn phòng trên Google Maps", en: "Office on Google Maps" } } },
    { name: "Đà Nẵng", main: "0901 234 540", lines: [{ label: { vi: "Hộ gia đình", en: "Households" }, phone: "0901 234 541" }, { label: { vi: "Dự án", en: "Projects" }, phone: "0901 234 542" }] },
  ],
  cta: { kind: "calculator", value: "", label: { vi: "Báo giá", en: "Get a quote" } },
  drawerActions: [
    { kind: "calculator", value: "", label: { vi: "Nhận tư vấn miễn phí", en: "Free consultation" } },
    { kind: "zalo", value: "0901 234 502", label: { vi: "Zalo Nhà xưởng", en: "Zalo Factory" } },
  ],
} satisfies z.input<typeof siteHeaderSchema>;
