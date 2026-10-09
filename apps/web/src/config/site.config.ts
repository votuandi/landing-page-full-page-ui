/**
 * ============================================================================
 *  SITE CONFIG — TOÀN BỘ THÔNG TIN CÔNG TY NẰM Ở FILE NÀY
 * ============================================================================
 * Tên, hotline theo chi nhánh, Zalo, địa chỉ, toạ độ, giấy phép, ISO, mạng xã hội,
 * số liệu, thương hiệu phân phối, dự án, báo chí, video… và cờ bật/tắt từng section.
 *
 * ⚠️ DỮ LIỆU DEMO HOÀN TOÀN HƯ CẤU: tên công ty, thương hiệu, tên báo, số điện thoại, địa chỉ,
 * số giấy phép, số liệu đều là mẫu. Thay toàn bộ trước khi xuất bản.
 *
 * Quy ước:
 *  - `enabled: false` → section/khối đó không render (và không vào schema SEO).
 *  - Chuỗi hiển thị có thể là "chuỗi" (chỉ tiếng Việt) hoặc { vi, en } để có bản tiếng Anh
 *    khi bật switch ngôn ngữ.
 *  - Ảnh để "" → hiển thị khung placeholder theo màu template (không cần file ảnh).
 *  - Video: { provider: "youtube", id: "<ID video>" } hoặc { provider: "file", src: "/videos/x.mp4" }.
 * ============================================================================
 */

import type { Segment } from "@solar/core";

export type Text = string | { vi: string; en: string };
export type VideoSource = { provider: "youtube"; id: string } | { provider: "file"; src: string };
export type GeoPoint = { address: string; lat: number; lng: number };

export type Branch = {
  id: string;
  /** Tên chi nhánh ngắn, vd. "TP. Hồ Chí Minh" */
  name: string;
  /** Chi nhánh chính → dùng làm số hotline mặc định, địa chỉ trụ sở trong schema */
  primary?: boolean;
  office: GeoPoint;
  warehouse?: GeoPoint;
  hotline: { main: string; household: string; project: string };
  /** Cửa hàng/showroom thuộc chi nhánh — hiện ở footer, mỗi số có nút Zalo */
  stores: { name: string; address: string; phone: string }[];
  /** Giờ mở cửa dạng schema.org, vd. "Mo-Sa 08:00-17:30" */
  openingHours: string;
};

export type BrandGroup = "panel" | "inverter" | "lithium" | "allinone" | "bess";
export type Brand = { name: string; group: BrandGroup; logo: string };

export type PriceChip = { label: Text; bill?: number; popular?: boolean };
export type PriceCategory = {
  id: string;
  label: Text;
  hint: Text;
  /** Phân khúc điền sẵn vào công cụ dự toán */
  segment: Segment;
  groups: { title?: Text; chips: PriceChip[] }[];
};

export type EquipmentGroup = {
  id: string;
  label: Text;
  /** Giá trị `category` của trang /san-pham */
  category: string;
  filters: { label: Text; query: Record<string, string> }[];
};

// -----------------------------------------------------------------------------

export const siteConfig = {
  brand: {
    name: "Lumivolt Energy",
    legalName: "CÔNG TY CỔ PHẦN NĂNG LƯỢNG LUMIVOLT [DỮ LIỆU MẪU]",
    tagline: { vi: "Nhà phân phối thiết bị & tổng thầu EPC điện mặt trời.", en: "Solar equipment distributor & EPC contractor." } as Text,
    description: "Phân phối chính hãng tấm pin, inverter, pin lithium, BESS và tổng thầu EPC điện mặt trời cho hộ gia đình, doanh nghiệp, nhà xưởng.",
    /** Ảnh logo trong /public. "" → logo tự vẽ theo màu template. */
    logo: "",
    logoText: "LV",
    foundedYear: 2012,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://template-15.minwysoft.com",
    /** Ảnh chia sẻ mạng xã hội (Open Graph) 1200×630 */
    ogImage: "/images/solar-installation-hero.jpg",
    /** Màu thanh trình duyệt trên mobile — nên trùng --bg trong globals.css */
    themeColor: "#F5FAF6",
    email: "lienhe@lumivolt.example",
  },

  /** "installer" = chỉ lắp đặt; "installer_distributor" = có trang /san-pham và menu Thiết bị. */
  siteMode: "installer_distributor" as "installer" | "installer_distributor",

  /** Catalog sản phẩm + giỏ yêu cầu báo giá (chỉ khi siteMode có phân phối). false → ẩn /san-pham, dải sản phẩm, giỏ. */
  catalog: { enabled: process.env.NEXT_PUBLIC_CATALOG_ENABLED !== "false" },

  /** Sau khi gửi form/giỏ: "Chúng tôi sẽ gọi lại trong X giờ". */
  callbackHours: 2,

  /** Link đánh giá bên ngoài (hero, khối đánh giá khách hàng). url "" → ẩn. */
  reviews: {
    google: { url: "https://www.google.com/maps", rating: 4.9, count: 312 },
    trustpilot: { url: "", rating: 0, count: 0 },
  },

  /** Dải cam kết dịch vụ ngay trên footer (mọi trang) — 4 mục hiển thị đẹp nhất. */
  commitments: [
    { title: { vi: "Khảo sát miễn phí", en: "Free site survey" }, desc: { vi: "Kỹ sư đến tận nơi đo mái, đọc hóa đơn", en: "Engineers measure your roof and read your bill" } },
    { title: { vi: "Bảo hành dài hạn", en: "Long warranty" }, desc: { vi: "Tấm pin tới 30 năm hiệu suất, thi công 5 năm", en: "Up to 30-year panel output, 5-year workmanship" } },
    { title: { vi: "Hỗ trợ thủ tục đấu nối EVN", en: "Grid paperwork handled" }, desc: { vi: "Chuẩn bị hồ sơ, làm việc với điện lực", en: "We prepare documents and liaise with EVN" } },
    { title: { vi: "Bảo trì & vệ sinh định kỳ", en: "Scheduled O&M" }, desc: { vi: "Kiểm tra, vệ sinh tấm pin theo lịch", en: "Inspection and panel cleaning on schedule" } },
  ] as { title: Text; desc: Text }[],

  /** Popup "Tư vấn sản phẩm": hiện sau delayMs HOẶC khi cuộn qua scrollRatio trang, tối đa 1 lần/phiên. */
  popup: { enabled: true, delayMs: 30_000, scrollRatio: 0.6 },

  i18n: { enabled: true, defaultLang: "vi" as "vi" | "en" },

  /** Giao diện: mặc định Sáng (light). switcher = hiện công tắc Sáng/Tối trên header (lựa chọn lưu trên trình duyệt). */
  theme: { default: "light" as "light" | "dark", switcher: true },

  /** Zalo dùng cho thanh điều hướng đáy (mobile) và CTA */
  zalo: {
    household: { label: { vi: "Zalo Gia đình", en: "Zalo Home" } as Text, phone: "0901 234 501" },
    factory: { label: { vi: "Zalo Nhà xưởng", en: "Zalo Factory" } as Text, phone: "0901 234 502" },
  },
  messenger: "",
  complaintHotline: "0901 234 599",
  workingHours: "Thứ 2 – Thứ 7: 08:00 – 17:30",

  branches: [
    {
      id: "hcm", name: "TP. Hồ Chí Minh", primary: true,
      office: { address: "Tầng 9, Tòa nhà Mẫu 268, đường Số 1, P. Mẫu, TP. Hồ Chí Minh [HƯ CẤU]", lat: 10.7865, lng: 106.6990 },
      warehouse: { address: "Kho K3, KCN Mẫu Tây Bắc, TP. Hồ Chí Minh [HƯ CẤU]", lat: 10.8710, lng: 106.6050 },
      hotline: { main: "0901 234 500", household: "0901 234 501", project: "0901 234 502" },
      stores: [
        { name: "Showroom Quận Mẫu", address: "120 Đường Mẫu A, TP. Hồ Chí Minh [HƯ CẤU]", phone: "0901 234 511" },
        { name: "Cửa hàng Mẫu Thủ Đức", address: "45 Đường Mẫu B, TP. Hồ Chí Minh [HƯ CẤU]", phone: "0901 234 512" },
      ],
      openingHours: "Mo-Sa 08:00-17:30",
    },
    {
      id: "hn", name: "Hà Nội",
      office: { address: "Tầng 6, Tòa nhà Mẫu 88, phố Mẫu, Hà Nội [HƯ CẤU]", lat: 21.0300, lng: 105.8000 },
      warehouse: { address: "Kho B2, Cụm công nghiệp Mẫu, Hà Nội [HƯ CẤU]", lat: 21.0900, lng: 105.9100 },
      hotline: { main: "0901 234 520", household: "0901 234 521", project: "0901 234 522" },
      stores: [{ name: "Showroom Mẫu Cầu Giấy", address: "18 Phố Mẫu C, Hà Nội [HƯ CẤU]", phone: "0901 234 531" }],
      openingHours: "Mo-Sa 08:00-17:30",
    },
    {
      id: "dn", name: "Đà Nẵng",
      office: { address: "56 Đường Mẫu D, Đà Nẵng [HƯ CẤU]", lat: 16.0600, lng: 108.2100 },
      warehouse: { address: "Kho C1, KCN Mẫu Hòa Khánh, Đà Nẵng [HƯ CẤU]", lat: 16.0750, lng: 108.1400 },
      hotline: { main: "0901 234 540", household: "0901 234 541", project: "0901 234 542" },
      stores: [{ name: "Cửa hàng Mẫu Hải Châu", address: "9 Đường Mẫu E, Đà Nẵng [HƯ CẤU]", phone: "0901 234 551" }],
      openingHours: "Mo-Sa 08:00-17:30",
    },
    {
      id: "dl", name: "Đắk Lắk",
      office: { address: "210 Đường Mẫu F, Buôn Ma Thuột, Đắk Lắk [HƯ CẤU]", lat: 12.6800, lng: 108.0400 },
      hotline: { main: "0901 234 560", household: "0901 234 561", project: "0901 234 562" },
      stores: [{ name: "Đại lý Mẫu Tây Nguyên", address: "32 Đường Mẫu G, Đắk Lắk [HƯ CẤU]", phone: "0901 234 571" }],
      openingHours: "Mo-Sa 07:30-17:00",
    },
    {
      id: "ct", name: "Cần Thơ",
      office: { address: "77 Đường Mẫu H, Cần Thơ [HƯ CẤU]", lat: 10.0300, lng: 105.7700 },
      warehouse: { address: "Kho Mẫu Trà Nóc, Cần Thơ [HƯ CẤU]", lat: 10.0950, lng: 105.7200 },
      hotline: { main: "0901 234 580", household: "0901 234 581", project: "0901 234 582" },
      stores: [{ name: "Showroom Mẫu Ninh Kiều", address: "15 Đường Mẫu I, Cần Thơ [HƯ CẤU]", phone: "0901 234 591" }],
      openingHours: "Mo-Sa 08:00-17:30",
    },
  ] as Branch[],

  legal: {
    businessRegistration: { number: "03XXXXXXXX [MẪU]", issuedBy: "Sở Kế hoạch và Đầu tư (mẫu)", issuedDate: "15/03/2012" },
    licenses: [
      "Chứng chỉ năng lực hoạt động xây dựng hạng II — số MẪU-0001 [HƯ CẤU]",
      "Giấy phép hoạt động điện lực (tư vấn thiết kế) — số MẪU-0002 [HƯ CẤU]",
    ],
    iso: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    /** Badge "Đã thông báo Bộ Công Thương": điền URL trang xác nhận thật khi có. Khung hiện là placeholder. */
    moitBadge: { enabled: true, url: "" },
    policies: [
      { slug: "bao-hanh", title: "Chính sách bảo hành", summary: "Thời hạn, điều kiện và quy trình bảo hành thiết bị và thi công." },
      { slug: "doi-tra", title: "Chính sách đổi trả", summary: "Điều kiện đổi trả thiết bị lỗi do nhà sản xuất." },
      { slug: "van-chuyen", title: "Chính sách vận chuyển", summary: "Phạm vi, thời gian và chi phí giao hàng tới công trình/đại lý." },
      { slug: "bao-mat", title: "Chính sách bảo mật", summary: "Cách chúng tôi thu thập và sử dụng thông tin khách hàng." },
      { slug: "dai-ly", title: "Chính sách đại lý", summary: "Điều kiện, chiết khấu và hỗ trợ dành cho đại lý." },
    ],
  },

  socials: [
    { id: "facebook", label: "Facebook", url: "https://www.facebook.com/lumivolt.demo", handle: "Lumivolt Energy", followers: 128_000 },
    { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@lumivolt.demo", handle: "@lumivolt.demo", followers: 46_500 },
    { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@lumivolt.demo", handle: "@lumivolt.demo", followers: 212_000 },
    { id: "zalo", label: "Zalo OA", url: "https://zalo.me/0901234500", handle: "Lumivolt Energy", followers: 18_300 },
  ] as { id: "facebook" | "youtube" | "tiktok" | "zalo"; label: string; url: string; handle: string; followers: number }[],

  /** Số liệu thống kê. "Năm kinh nghiệm" tự tính từ brand.foundedYear. */
  stats: { enabled: true, mwp: 186.4, projects: 4_200, dealers: 320, provinces: 34, engineers: 85, customers: 12_500 },

  // ---------------------------------------------------------------------------
  //  HEADER, TOP BAR, MENU
  // ---------------------------------------------------------------------------

  topBar: {
    enabled: true,
    items: [
      { vi: "Đầy đủ chứng từ VAT, CO, CQ cho mọi lô hàng", en: "Full VAT invoice, CO & CQ for every shipment" },
      { vi: "Cam kết hàng chính hãng 100%", en: "100% genuine products guaranteed" },
      { vi: "Hệ thống quản lý ISO 9001 · 14001 · 45001", en: "ISO 9001 · 14001 · 45001 management system" },
      { vi: "Chính sách đại lý chiết khấu tới 18%", en: "Dealer discounts up to 18%" },
      { vi: "Kỹ sư khảo sát miễn phí trong 48 giờ", en: "Free engineer site survey within 48 hours" },
    ] as Text[],
  },

  /** Mega menu "Bảng giá lắp đặt": bấm chip → cuộn tới công cụ dự toán và điền sẵn. */
  pricing: {
    enabled: true,
    categories: [
      {
        id: "ho-gia-dinh", label: { vi: "Hộ gia đình", en: "Households" }, hint: { vi: "Theo tiền điện/tháng", en: "By monthly bill" }, segment: "household",
        groups: [
          { title: { vi: "Không lưu trữ", en: "Grid-tied" }, chips: [
            { label: { vi: "1 – 2 triệu", en: "1 – 2M VND" }, bill: 1_500_000 },
            { label: { vi: "2 – 3 triệu", en: "2 – 3M VND" }, bill: 2_500_000, popular: true },
            { label: { vi: "3 – 5 triệu", en: "3 – 5M VND" }, bill: 4_000_000 },
            { label: { vi: "Trên 5 triệu", en: "Over 5M VND" }, bill: 6_500_000 },
          ] },
          { title: { vi: "Có lưu trữ", en: "With battery" }, chips: [
            { label: { vi: "2 – 3 triệu", en: "2 – 3M VND" }, bill: 2_500_000 },
            { label: { vi: "3 – 5 triệu", en: "3 – 5M VND" }, bill: 4_000_000, popular: true },
            { label: { vi: "Trên 5 triệu", en: "Over 5M VND" }, bill: 6_500_000 },
          ] },
        ],
      },
      {
        id: "doanh-nghiep", label: { vi: "Doanh nghiệp", en: "Businesses" }, hint: { vi: "Văn phòng, cửa hàng, khách sạn", en: "Offices, shops, hotels" }, segment: "shop",
        groups: [{ chips: [
          { label: { vi: "5 – 15 triệu", en: "5 – 15M VND" }, bill: 10_000_000 },
          { label: { vi: "15 – 30 triệu", en: "15 – 30M VND" }, bill: 22_000_000, popular: true },
          { label: { vi: "30 – 60 triệu", en: "30 – 60M VND" }, bill: 45_000_000 },
          { label: { vi: "Trên 60 triệu", en: "Over 60M VND" }, bill: 80_000_000 },
        ] }],
      },
      {
        id: "nha-xuong", label: { vi: "Nhà xưởng", en: "Factories" }, hint: { vi: "Sản xuất, kho lạnh, trang trại", en: "Manufacturing, cold storage, farms" }, segment: "factory",
        groups: [{ chips: [
          { label: { vi: "50 – 150 triệu", en: "50 – 150M VND" }, bill: 100_000_000 },
          { label: { vi: "150 – 300 triệu", en: "150 – 300M VND" }, bill: 220_000_000, popular: true },
          { label: { vi: "300 – 600 triệu", en: "300 – 600M VND" }, bill: 450_000_000 },
          { label: { vi: "Trên 600 triệu", en: "Over 600M VND" }, bill: 800_000_000 },
        ] }],
      },
      {
        id: "bom-nuoc", label: { vi: "Bơm nước", en: "Water pumps" }, hint: { vi: "Theo công suất bơm (HP)", en: "By pump power (HP)" }, segment: "farm",
        groups: [{ chips: [
          { label: "1 HP", bill: 500_000 },
          { label: "2 HP", bill: 1_000_000 },
          { label: "3 HP", bill: 1_500_000, popular: true },
          { label: "5 HP", bill: 2_500_000 },
          { label: "7,5 HP", bill: 3_800_000 },
          { label: "10 HP", bill: 5_000_000 },
        ] }],
      },
      {
        id: "om", label: "O&M", hint: { vi: "Vận hành & bảo trì theo MWp", en: "Operation & maintenance by MWp" }, segment: "factory",
        groups: [{ chips: [
          { label: "< 0,5 MWp" },
          { label: "0,5 – 1 MWp", popular: true },
          { label: "1 – 3 MWp" },
          { label: "> 3 MWp" },
        ] }],
      },
      {
        id: "ve-sinh", label: { vi: "Vệ sinh", en: "Cleaning" }, hint: { vi: "Vệ sinh tấm pin định kỳ", en: "Periodic panel cleaning" }, segment: "shop",
        groups: [{ chips: [
          { label: "< 10 kWp" },
          { label: "10 – 50 kWp", popular: true },
          { label: "50 – 200 kWp" },
          { label: "> 200 kWp" },
        ] }],
      },
    ] as PriceCategory[],
  },

  /** Mega menu "Thiết bị": mỗi chip mở /san-pham với bộ lọc tương ứng. */
  equipment: {
    enabled: true,
    groups: [
      { id: "panel", label: { vi: "Tấm pin", en: "Solar panels" }, category: "panel", filters: [
        { label: "Helionyx", query: { brand: "Helionyx" } },
        { label: "Solvane", query: { brand: "Solvane" } },
        { label: "N-type TOPCon", query: { tech: "N-type TOPCon" } },
        { label: { vi: "Hai mặt kính", en: "Bifacial" }, query: { tech: "Bifacial" } },
        { label: "≥ 600 W", query: { minPower: "0.6" } },
        { label: { vi: "Phân khúc dự án", en: "Utility / C&I" }, query: { segment: "project" } },
      ] },
      { id: "inverter", label: "Inverter", category: "inverter", filters: [
        { label: "Voltaris", query: { brand: "Voltaris" } },
        { label: "Kinetra", query: { brand: "Kinetra" } },
        { label: { vi: "Hòa lưới", en: "On-grid" }, query: { tech: "On-grid" } },
        { label: "Hybrid", query: { tech: "Hybrid" } },
        { label: "≥ 50 kW", query: { minPower: "50" } },
        { label: { vi: "Hộ gia đình", en: "Residential" }, query: { segment: "home" } },
      ] },
      { id: "lithium", label: "Lithium", category: "battery", filters: [
        { label: "Litheon", query: { brand: "Litheon" } },
        { label: "Cellora", query: { brand: "Cellora" } },
        { label: "LiFePO4", query: { tech: "LiFePO4" } },
        { label: { vi: "Điện áp cao", en: "High voltage" }, query: { tech: "High Voltage" } },
        { label: "≥ 10 kWh", query: { minPower: "10" } },
      ] },
      { id: "allinone", label: "All-in-one", category: "allinone", filters: [
        { label: "Kinetra", query: { brand: "Kinetra" } },
        { label: "5 – 10 kW", query: { minPower: "5", maxPower: "10" } },
        { label: { vi: "Hộ gia đình", en: "Residential" }, query: { segment: "home" } },
      ] },
      { id: "bess", label: "BESS", category: "bess", filters: [
        { label: "Ferrovolt", query: { brand: "Ferrovolt" } },
        { label: { vi: "Tủ ngoài trời", en: "Outdoor cabinet" }, query: { tech: "Outdoor cabinet" } },
        { label: "≥ 200 kWh", query: { minPower: "200" } },
        { label: { vi: "Phân khúc dự án", en: "Utility / C&I" }, query: { segment: "project" } },
      ] },
      { id: "accessory", label: { vi: "Phụ kiện", en: "Accessories" }, category: "accessory", filters: [
        { label: "Connecta", query: { brand: "Connecta" } },
        { label: { vi: "Đầu nối MC4", en: "MC4 connectors" }, query: { tech: "MC4" } },
        { label: { vi: "Cáp DC", en: "DC cable" }, query: { tech: "DC cable" } },
      ] },
    ] as EquipmentGroup[],
  },

  /** Mega menu "Cẩm nang" → trang /cam-nang */
  guide: {
    enabled: true,
    items: [
      { id: "thuat-ngu", label: { vi: "Thuật ngữ", en: "Glossary" }, desc: { vi: "kWp, PR, MPPT, hybrid… giải thích dễ hiểu", en: "kWp, PR, MPPT, hybrid… explained" } },
      { id: "bieu-gia", label: { vi: "Biểu giá điện", en: "Electricity tariffs" }, desc: { vi: "Bậc thang sinh hoạt, kinh doanh, sản xuất", en: "Residential, commercial and industrial rates" } },
      { id: "van-ban", label: { vi: "Văn bản pháp luật", en: "Regulations" }, desc: { vi: "Quy định về điện mặt trời mái nhà", en: "Rooftop solar regulations" } },
      { id: "hoi-dap", label: { vi: "Hỏi đáp", en: "FAQ" }, desc: { vi: "Câu hỏi thường gặp trước khi lắp", en: "Common questions before installing" } },
      { id: "tin-tuc", label: { vi: "Báo chí", en: "Press" }, desc: { vi: "Báo chí nói về chúng tôi", en: "Press coverage" } },
      { id: "kinh-nghiem", label: { vi: "Kinh nghiệm lắp đặt", en: "Blog" }, desc: { vi: "Bài viết theo tình huống thực tế", en: "Real-life use cases" }, href: "/tin-tuc" },
    ] as { id: string; label: Text; desc: Text; href?: string }[],
    glossary: [
      ["kWp", "Kilowatt-peak — công suất danh định của hệ pin ở điều kiện chuẩn (1000 W/m², 25 °C)."],
      ["kWh", "Đơn vị điện năng. 1 kWh = 1 'số điện' trên hóa đơn."],
      ["PR (Performance Ratio)", "Tỷ lệ hiệu suất thực tế của hệ thống sau tổn hao nhiệt, dây dẫn, inverter, bụi bẩn."],
      ["Inverter hòa lưới", "Bộ chuyển DC → AC đồng bộ với lưới điện; tự ngắt khi lưới mất điện."],
      ["Inverter hybrid", "Inverter kết hợp sạc/xả pin lưu trữ, có thể cấp điện dự phòng khi mất lưới."],
      ["MPPT", "Bộ dò điểm công suất cực đại, giúp tấm pin luôn phát ở công suất tối ưu."],
      ["BESS", "Battery Energy Storage System — hệ lưu trữ năng lượng bằng pin cho nhà xưởng, dự án."],
      ["LiFePO4", "Hóa học pin lithium sắt phốt phát — tuổi thọ chu kỳ cao, an toàn nhiệt tốt."],
      ["EPC", "Engineering – Procurement – Construction: tổng thầu thiết kế, cung cấp thiết bị và thi công."],
      ["O&M", "Operation & Maintenance — vận hành, bảo trì, vệ sinh và giám sát hệ thống."],
      ["CO / CQ", "Chứng nhận xuất xứ (Certificate of Origin) và chứng nhận chất lượng (Certificate of Quality)."],
      ["Tự sản xuất, tự tiêu thụ", "Mô hình điện mặt trời mái nhà dùng điện tại chỗ, ưu tiên không phát lên lưới."],
    ] as [string, string][],
    regulations: [
      { title: "Luật Điện lực (sửa đổi) 2024", note: "Khung pháp lý chung cho hoạt động điện lực. [CẦN XÁC MINH hiệu lực]" },
      { title: "Nghị định về cơ chế khuyến khích điện mặt trời mái nhà tự sản xuất, tự tiêu thụ", note: "Quy định đăng ký, thông báo, công suất và phần điện dư. [CẦN XÁC MINH số hiệu văn bản hiện hành]" },
      { title: "Quyết định của Bộ Công Thương về giá bán lẻ điện", note: "Căn cứ để tính tiền điện tiết kiệm. [CẦN XÁC MINH văn bản hiện hành]" },
      { title: "Quy chuẩn/tiêu chuẩn an toàn điện và PCCC cho hệ thống PV", note: "Áp dụng khi thiết kế, thi công và nghiệm thu. [CẦN XÁC MINH]" },
    ],
  },

  // ---------------------------------------------------------------------------
  //  SECTION TRANG CHỦ (theo thứ tự hiển thị)
  // ---------------------------------------------------------------------------

  hero: { enabled: true },
  calculator: { enabled: true },

  certificates: {
    enabled: true,
    /** image: ảnh scan giấy chứng nhận (bản demo: SVG có chữ "MẪU" tạo bằng scripts/make-trust-images.js). "" → khung minh họa. */
    items: [
      { id: "iso9001", title: "ISO 9001:2015", subtitle: { vi: "Hệ thống quản lý chất lượng", en: "Quality management" } as Text, issuer: "Tổ chức chứng nhận Mẫu QA (hư cấu)", number: "QA-MẪU-9001", validUntil: "12/2027", scope: "Phân phối thiết bị điện mặt trời; tư vấn thiết kế, thi công lắp đặt hệ thống điện mặt trời.", image: "/images/trust/cert-iso-9001-full.svg" },
      { id: "iso14001", title: "ISO 14001:2015", subtitle: { vi: "Quản lý môi trường", en: "Environmental management" } as Text, issuer: "Tổ chức chứng nhận Mẫu QA (hư cấu)", number: "QA-MẪU-14001", validUntil: "12/2027", scope: "Hoạt động kho bãi, thi công và thu hồi vật tư tại các chi nhánh.", image: "/images/trust/cert-iso-14001-full.svg" },
      { id: "iso45001", title: "ISO 45001:2018", subtitle: { vi: "An toàn sức khỏe nghề nghiệp", en: "Occupational health & safety" } as Text, issuer: "Tổ chức chứng nhận Mẫu QA (hư cấu)", number: "QA-MẪU-45001", validUntil: "06/2028", scope: "Thi công trên mái, làm việc trên cao và đấu nối điện.", image: "/images/trust/cert-iso-45001-full.svg" },
      { id: "xd-hang-2", title: { vi: "Chứng chỉ năng lực XD hạng II", en: "Construction capability – Class II" } as Text, subtitle: { vi: "Thi công công trình năng lượng", en: "Energy construction works" } as Text, issuer: "Sở Xây dựng (mẫu)", number: "MẪU-0001", validUntil: "03/2030", scope: "Thi công lắp đặt thiết bị công trình năng lượng; tư vấn giám sát.", image: "/images/trust/cert-xd-hang-2-full.svg" },
      { id: "gp-dien-luc", title: { vi: "Giấy phép hoạt động điện lực", en: "Electricity operation licence" } as Text, subtitle: { vi: "Tư vấn thiết kế", en: "Design consulting" } as Text, issuer: "Cơ quan cấp phép (mẫu)", number: "MẪU-0002", validUntil: "09/2029", scope: "Tư vấn thiết kế công trình đường dây và trạm biến áp đến 35 kV.", image: "/images/trust/cert-gp-dien-luc-full.svg" },
      { id: "phan-phoi", title: { vi: "Nhà phân phối ủy quyền", en: "Authorised distributor" } as Text, subtitle: "Helionyx · Voltaris · Litheon", issuer: "Các hãng thiết bị (hư cấu)", number: "AUTH-2026-VN", validUntil: "12/2026", scope: "Phân phối chính hãng tại Việt Nam, bảo hành trực tiếp qua Lumivolt.", image: "/images/trust/cert-phan-phoi-full.svg" },
      { id: "lap-dat", title: { vi: "Đối tác lắp đặt được chứng nhận", en: "Certified installer" } as Text, subtitle: { vi: "Inverter & pin lưu trữ", en: "Inverters & storage" } as Text, issuer: "Các hãng thiết bị (hư cấu)", number: "PV-MẪU-0315", validUntil: "06/2027", scope: "Lắp đặt, cấu hình và bảo hành inverter hybrid, pin lưu trữ.", image: "/images/trust/cert-lap-dat-full.svg" },
      { id: "an-toan-dien", title: { vi: "Chứng chỉ an toàn điện", en: "Electrical safety" } as Text, subtitle: { vi: "Cho kỹ thuật viên", en: "For technicians" } as Text, issuer: "[CẦN XÁC MINH]", number: "ATĐ-MẪU-2026", validUntil: "12/2026", scope: "Toàn bộ kỹ thuật viên thi công và bảo trì.", image: "/images/trust/cert-an-toan-dien-full.svg" },
      { id: "pccc", title: { vi: "Đủ điều kiện thi công PCCC", en: "Fire-safety works" } as Text, subtitle: { vi: "Hệ PV và BESS", en: "PV and BESS systems" } as Text, issuer: "[CẦN XÁC MINH]", number: "PCCC-MẪU-07", validUntil: "08/2028", scope: "Thiết kế, thi công giải pháp PCCC cho hệ điện mặt trời và lưu trữ.", image: "/images/trust/cert-pccc-full.svg" },
    ] as { id: string; title: Text; subtitle: Text; issuer: string; number: string; validUntil: string; scope: string; image: string }[],
  },

  brands: {
    enabled: true,
    signingVideo: {
      title: { vi: "Lễ ký kết hợp tác phân phối 2026", en: "2026 distribution agreement signing" } as Text,
      caption: "Lumivolt × Helionyx × Voltaris (hư cấu)",
      poster: "/images/our_story.webp",
      video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource,
    },
    list: [
      { name: "Helionyx", group: "panel", logo: "" },
      { name: "Solvane", group: "panel", logo: "" },
      { name: "Lumora", group: "panel", logo: "" },
      { name: "Voltaris", group: "inverter", logo: "" },
      { name: "Kinetra", group: "inverter", logo: "" },
      { name: "Ohmora", group: "inverter", logo: "" },
      { name: "Litheon", group: "lithium", logo: "" },
      { name: "Cellora", group: "lithium", logo: "" },
      { name: "Ferrovolt", group: "bess", logo: "" },
    ] as Brand[],
  },

  /** Gói giải pháp (dữ liệu gói ở src/data/packages.ts) */
  packages: { enabled: true },

  /** Dự án tiêu biểu — tab theo logo khách hàng */
  projects: {
    enabled: true,
    items: [
      { id: "minh-phat", segment: "factory" as Segment, client: "Dệt may Minh Phát (hư cấu)", logoText: "MP", industry: "Dệt may", location: "Bình Dương (cũ) – TP. HCM", image: "/images/illustrations/factory-solar.webp",
        description: "Nhà máy dệt 3 ca, tải nền lớn ban ngày. Hệ áp mái 1,2 MWp kết hợp BESS 500 kWh để cắt đỉnh giờ cao điểm; thi công theo phân khu, không dừng dây chuyền.",
        kwp: 1_200, kwhPerYear: 1_650_000, savingPerYear: 3_100_000_000, co2PerYear: 1_120,
        video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { id: "an-khang-cold", segment: "factory" as Segment, client: "Kho lạnh An Khang Food (hư cấu)", logoText: "AK", industry: "Kho lạnh", location: "Long An (cũ) – Tây Ninh", image: "/images/illustrations/cold-storage-solar.webp",
        description: "Tải lạnh chạy 24/7. Hệ 620 kWp tự dùng ~95%, giám sát theo từng string, vệ sinh định kỳ hằng quý.",
        kwp: 620, kwhPerYear: 860_000, savingPerYear: 1_640_000_000, co2PerYear: 580,
        video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { id: "song-hong-resort", segment: "shop" as Segment, client: "Resort Sông Hồng (hư cấu)", logoText: "SH", industry: "Khách sạn", location: "Hà Nội", image: "/images/illustrations/shop-solar.webp",
        description: "Khu nghỉ dưỡng 120 phòng. Hệ hybrid 250 kWp + lưu trữ 215 kWh giữ điện cho bơm nhiệt, hồ bơi và chiếu sáng khi mất lưới.",
        kwp: 250, kwhPerYear: 290_000, savingPerYear: 820_000_000, co2PerYear: 195,
        video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { id: "nong-trai-xanh", segment: "farm" as Segment, client: "Trang trại Xanh Tây Nguyên (hư cấu)", logoText: "XT", industry: "Nông nghiệp", location: "Đắk Lắk", image: "/images/illustrations/farm-hybrid-solar.webp",
        description: "Tưới cà phê bằng bơm năng lượng mặt trời và hệ 320 kWp áp mái kho sấy, giảm chi phí dầu diesel cho máy phát.",
        kwp: 320, kwhPerYear: 470_000, savingPerYear: 960_000_000, co2PerYear: 315,
        video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
    ],
  },

  /** Giải pháp theo phân khúc + slider video công trình thực tế */
  solutions: {
    enabled: true,
    segments: [
      { id: "home", label: { vi: "Hộ gia đình", en: "Households" } as Text, image: "/images/illustrations/home-solar-tall.webp",
        points: ["Hòa lưới hoặc hybrid có lưu trữ", "Theo dõi sản lượng trên điện thoại", "Trả góp 0% qua đối tác (mẫu)"], calcSegment: "household" as Segment },
      { id: "business", label: { vi: "Doanh nghiệp", en: "Businesses" } as Text, image: "/images/illustrations/shop-solar-tall.webp",
        points: ["Giờ kinh doanh trùng giờ nắng", "Báo cáo tiết kiệm hằng tháng", "Thi công ngoài giờ, không gián đoạn"], calcSegment: "shop" as Segment },
      { id: "factory", label: { vi: "Nhà xưởng", en: "Factories" } as Text, image: "/images/illustrations/factory-solar-tall.webp",
        points: ["EPC trọn gói từ hồ sơ tới đấu nối", "BESS cắt đỉnh, dự phòng tải", "Mô hình ESCO 0 đồng (mẫu)"], calcSegment: "factory" as Segment },
      { id: "farm", label: { vi: "Nông nghiệp", en: "Agriculture" } as Text, image: "/images/illustrations/farm-hybrid-solar.webp",
        points: ["Bơm nước năng lượng mặt trời", "Khung chống ăn mòn chuồng trại", "Thay thế máy phát diesel"], calcSegment: "farm" as Segment },
    ],
    videos: [
      { title: "Thi công 1,2 MWp nhà máy dệt", location: "TP. HCM", poster: "/images/illustrations/factory-solar.webp", video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { title: "Lắp BESS 500 kWh ngoài trời", location: "TP. HCM", poster: "/images/solar-battery-hero.jpg", video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { title: "Nhà phố hybrid 10 kWp", location: "Hà Nội", poster: "/images/illustrations/home-solar.webp", video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { title: "Bơm tưới cà phê 7,5 HP", location: "Đắk Lắk", poster: "/images/illustrations/farm-hybrid-solar.webp", video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
      { title: "Kho lạnh 620 kWp bàn giao", location: "Tây Ninh", poster: "/images/illustrations/cold-storage-solar.webp", video: { provider: "file", src: "/videos/hero_video.mp4" } as VideoSource },
    ],
  },


  press: {
    enabled: true,
    /** Tên báo HƯ CẤU — logo là chữ tự sinh, không dùng logo báo thật. */
    outlets: [
      { id: "nmt", name: "Nhật báo Mặt Trời", short: "NMT" },
      { id: "nlm", name: "Tạp chí Năng Lượng Mẫu", short: "NLM" },
      { id: "ktx", name: "Kênh Kinh Tế Xanh TV", short: "KTX" },
      { id: "cns", name: "Bản tin Công Nghiệp Số", short: "CNS" },
      { id: "ptm", name: "Đài Truyền hình Mẫu", short: "PTM" },
      { id: "dnv", name: "Doanh Nhân Việt Mẫu", short: "DNV" },
    ],
    articles: [
      { outlet: "nmt", date: "2026-09-18", title: "Lumivolt khánh thành hệ BESS 500 kWh cho nhà máy dệt", excerpt: "Hệ lưu trữ giúp nhà máy cắt đỉnh phụ tải giờ cao điểm, giảm khoảng 12% chi phí điện hằng tháng.", image: "/images/solar-battery-hero.jpg", url: "https://example.com/bai-viet-1" },
      { outlet: "ktx", date: "2026-08-02", title: "Phóng sự: Một ngày cùng đội kỹ sư lắp điện mặt trời áp mái", excerpt: "Từ khảo sát kết cấu đến nghiệm thu chống dột — quy trình 5 bước được ghi lại trên công trường.", image: "/images/solar-installation-hero.jpg", url: "https://example.com/bai-viet-2" },
      { outlet: "nlm", date: "2026-06-21", title: "Nhà phân phối nội địa và bài toán chứng từ CO, CQ", excerpt: "Minh bạch nguồn gốc thiết bị trở thành tiêu chí đầu tiên khi doanh nghiệp chọn tổng thầu EPC.", image: "/images/solar-inverter-hero.jpg", url: "https://example.com/bai-viet-3" },
      { outlet: "cns", date: "2026-04-10", title: "Mô hình đại lý điện mặt trời cấp tỉnh: cơ hội và rủi ro", excerpt: "Hơn 300 đại lý trong hệ thống được đào tạo kỹ thuật và hỗ trợ bảo hành trực tiếp.", image: "/images/solar-panels-hero.jpg", url: "https://example.com/bai-viet-4" },
      { outlet: "ptm", date: "2026-02-15", title: "Bơm nước năng lượng mặt trời giúp nông dân Tây Nguyên giảm chi phí", excerpt: "Hệ bơm 7,5 HP thay thế máy dầu, hoàn vốn sau khoảng 3 mùa tưới.", image: "/images/illustrations/farm-hybrid-solar.webp", url: "https://example.com/bai-viet-5" },
    ],
  },

  tiktok: {
    enabled: true,
    /** provider "tiktok" cần ID số của video (idOrSrc); bản demo dùng file mp4 cục bộ trong /public/videos/shorts. */
    videos: [
      { id: "tt1", creator: "@lumivolt.demo", title: "Lắp 6 kWp nhà phố trong 1 ngày", segment: "household" as Segment, poster: "/images/shorts/ho-gia-dinh-1.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/ho-gia-dinh-1.mp4" } },
      { id: "tt2", creator: "@kysu.nang", title: "Kiểm tra string bằng camera nhiệt", segment: "factory" as Segment, poster: "/images/shorts/nha-xuong-1.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/nha-xuong-1.mp4" } },
      { id: "tt3", creator: "@lumivolt.demo", title: "Cửa hàng giảm 40% tiền điện", segment: "shop" as Segment, poster: "/images/shorts/cua-hang-1.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/cua-hang-1.mp4" } },
      { id: "tt4", creator: "@daily.mientay", title: "Trại gà chạy quạt hút bằng nắng", segment: "farm" as Segment, poster: "/images/shorts/trang-trai-1.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/trang-trai-1.mp4" } },
      { id: "tt5", creator: "@lumivolt.demo", title: "Hybrid có điện khi mất lưới", segment: "household" as Segment, poster: "/images/shorts/ho-gia-dinh-2.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/ho-gia-dinh-2.mp4" } },
      { id: "tt6", creator: "@kysu.nang", title: "Kho lạnh 500 kWp bàn giao", segment: "factory" as Segment, poster: "/images/shorts/nha-xuong-2.webp", source: { provider: "file" as const, idOrSrc: "/videos/shorts/nha-xuong-2.mp4" } },
    ],
  },

  dealer: {
    enabled: true,
    stats: [
      { value: 320, suffix: "+", label: { vi: "Đại lý toàn quốc", en: "Dealers nationwide" } as Text },
      { value: 34, suffix: "", label: { vi: "Tỉnh/thành phủ sóng", en: "Provinces covered" } as Text },
      { value: 18, suffix: "%", label: { vi: "Chiết khấu tối đa", en: "Max. discount" } as Text },
    ],
    policies: [
      { title: "Chiết khấu theo bậc doanh số", body: "Từ 8% đến 18% theo doanh số quý; thưởng thêm khi đạt mục tiêu năm. [DỮ LIỆU MẪU]" },
      { title: "Hàng chính hãng, đủ chứng từ", body: "Mọi lô hàng có hóa đơn VAT, CO, CQ; hỗ trợ hồ sơ nghiệm thu cho công trình của đại lý." },
      { title: "Đào tạo kỹ thuật miễn phí", body: "Khóa thiết kế, lắp đặt, cấu hình inverter/pin lưu trữ định kỳ tại 5 chi nhánh." },
      { title: "Bảo hành 1 đổi 1 tại chi nhánh", body: "Đại lý gửi bảo hành trực tiếp tại kho gần nhất, không phải gửi về hãng." },
      { title: "Hỗ trợ marketing", body: "Biển hiệu, catalogue, nội dung mạng xã hội và lead khách hàng theo khu vực." },
    ],
    faqs: [
      ["Điều kiện trở thành đại lý là gì?", "Có pháp nhân hoặc hộ kinh doanh, có điểm bán hoặc đội thi công, cam kết doanh số tối thiểu theo quý (mẫu). Chi tiết trao đổi trực tiếp với phòng kinh doanh."],
      ["Có cần ký quỹ không?", "Không bắt buộc. Đại lý có thể chọn thanh toán theo đơn hoặc hạn mức công nợ sau 2 quý hợp tác (mẫu)."],
      ["Thời gian giao hàng bao lâu?", "1–3 ngày làm việc từ kho chi nhánh gần nhất; đơn số lượng lớn giao thẳng từ kho tổng."],
      ["Đại lý có được hỗ trợ thi công dự án lớn?", "Có. Đội kỹ sư EPC hỗ trợ khảo sát, thiết kế và giám sát các dự án nhà xưởng do đại lý giới thiệu."],
    ] as [string, string][],
    gallery: [
      { title: "Hội nghị đại lý 2026", image: "/images/solar-panels-hero.jpg" },
      { title: "Đào tạo kỹ thuật inverter hybrid", image: "/images/solar-inverter-hero.jpg" },
      { title: "Tham quan nhà máy đối tác", image: "/images/illustrations/factory-solar.webp" },
      { title: "Khai trương đại lý Tây Nguyên", image: "/images/illustrations/farm-hybrid-solar.webp" },
      { title: "Workshop BESS cho nhà xưởng", image: "/images/solar-battery-hero.jpg" },
    ],
    businessTypes: ["Cửa hàng điện / vật tư", "Đội thi công lắp đặt", "Công ty xây dựng / M&E", "Cá nhân giới thiệu khách", "Khác"],
  },

  branchMap: { enabled: true },

  engineerBanner: {
    enabled: true,
    image: "/images/services/service_1772898001151.webp",
  },

  // Các section gộp từ template-13 và kế thừa — bật/tắt từng cái.
  segmentGrid: { enabled: true },       // lưới 4 phân khúc → lọc video, gói, công trình, điền sẵn dự toán
  videoStories: { enabled: true },      // video Shorts công trình + trình phát trong trang
  projectsGallery: { enabled: true },   // gallery công trình (nút play mở đúng video)
  productStrip: { enabled: true },      // dải sản phẩm nổi bật (cần catalog)
  energyMonitoring: { enabled: true },  // theo dõi điện năng 24/7
  testimonials: { enabled: true },      // đánh giá khách hàng + điểm Google
  process: { enabled: true },           // quy trình 5 bước
  blog: { enabled: true, limit: 3 as 3 | 4 | 5 | 6 }, // bài viết mới nhất (src/data/posts.ts)
  social: { enabled: true },
  faq: { enabled: true },
  contactForm: { enabled: true },
  mobileBottomNav: { enabled: true },

  /** Section kế thừa từ template-12 — tắt sẵn, bật lại nếu cần. */
  legacy: {
    investmentModels: { enabled: false },
    warranty: { enabled: false },
  },

  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    templateCtaUrl: process.env.NEXT_PUBLIC_TEMPLATE_CTA_URL || "/lien-he",
    pricingUrl: process.env.NEXT_PUBLIC_PRICING_URL || "/lien-he",
  },
};

export type SiteConfig = typeof siteConfig;
