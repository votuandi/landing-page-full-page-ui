/** NGUỒN NỘI DUNG DUY NHẤT CỦA TEMPLATE-10.
 * isDemo: true: tên khách hàng, lời nhận xét, công suất, số liệu và điều kiện tài chính đều minh họa.
 * Thay nội dung/ảnh/hệ số ở file này trước khi dùng cho một doanh nghiệp thật.
 */
export const SITE_CONFIG = {
  isDemo: true, // Dữ liệu demo: thay toàn bộ thông tin công ty và số liệu trước khi bán.
  brand: {
    name: "Minwy Solar",
    legalName: "CÔNG TY TNHH MINWY SOLAR [DỮ LIỆU MẪU]",
    tagline: "Giảm chi phí điện. Tăng hiệu quả vận hành.",
    logoText: "MW",
    logo: "/brand-mark.svg",
    favicon: "/favicon.svg",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://template-10.minwysoft.com",
  contact: {
    phone: "0708 699 808",
    phoneRaw: "0708699808",
    zalo: "https://zalo.me/0708699808",
    email: "divt.it97@gmail.com",
    address: "Khu công nghiệp Tân Tạo, TP. Hồ Chí Minh [DỮ LIỆU MẪU]",
    taxCode: "0312XXXXXX [DỮ LIỆU MẪU]",
    license: "Giấy phép/đăng ký ngành nghề: [CẦN XÁC MINH]",
    facebook: "https://facebook.com/",
    linkedin: "https://linkedin.com/",
  },
  capabilities: {
    years: 11,
    projects: 286,
    mwp: 38.6,
    engineers: 24,
    provinces: 18,
  },
  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    templateCtaUrl: process.env.NEXT_PUBLIC_TEMPLATE_CTA_URL || "/contact-us",
    pricingUrl: process.env.NEXT_PUBLIC_PRICING_URL || "/contact-us",
  },
  legal: {
    ministryNoticeLogo: "[PLACEHOLDER LOGO THÔNG BÁO BỘ CÔNG THƯƠNG]",
    privacyHref: "#",
    termsHref: "#",
  },
} as const;

export const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Giải pháp", href: "/service" },
  { label: "Thiết bị", href: "/product" },
  { label: "Dự án", href: "/#du-an" },
  { label: "Về chúng tôi", href: "/about-us" },
  { label: "Liên hệ", href: "/contact-us" },
] as const;

export const THEME_PRESETS = {
  solar: { label: "Xanh nắng", primary: "#0d3b78", accent: "#f7b928" },
  navy: { label: "Navy kỹ thuật", primary: "#071b33", accent: "#f5b927" },
  graphite: { label: "Than chì", primary: "#17202b", accent: "#ffb703" },
  forest: { label: "Xanh rừng", primary: "#12372a", accent: "#f4c95d" },
  royal: { label: "Xanh hoàng gia", primary: "#172554", accent: "#facc15" },
} as const;
export type ProductCategory = "panel" | "inverter" | "battery" | "accessory";
export type Product = {
  slug: string;
  category: ProductCategory;
  brand: string;
  name: string;
  image: string;
  powerKw: number;
  price?: number;
  quoteOnly?: boolean;
  warranty: string;
  datasheet: string;
  specs: Record<string, string>;
  compatible: string[];
  isDemo: boolean;
};

export const PRODUCTS: Product[] = [
  {
    slug: "tam-pin-585w",
    category: "panel",
    brand: "Nhãn thiết bị A",
    name: "Tấm pin hiệu suất cao 585 W",
    image: "/images/template-10/factory.webp",
    powerKw: 0.585,
    price: 3450000,
    warranty: "Hiệu suất 25 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Công suất": "585 W",
      "Hiệu suất mẫu": "22,6%",
      "Ứng dụng": "Mái nhà xưởng",
    },
    compatible: ["bien-tan-125kw"],
    isDemo: true,
  },
  {
    slug: "tam-pin-580w",
    category: "panel",
    brand: "Nhãn thiết bị B",
    name: "Tấm pin áp mái 580 W",
    image: "/images/template-10/home.webp",
    powerKw: 0.58,
    price: 3320000,
    warranty: "Hiệu suất 25 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Công suất": "580 W",
      "Hiệu suất mẫu": "22,5%",
      "Ứng dụng": "Mái nhà",
    },
    compatible: ["bien-tan-hybrid-10kw"],
    isDemo: true,
  },
  {
    slug: "bien-tan-125kw",
    category: "inverter",
    brand: "Nhãn thiết bị C",
    name: "Biến tần nhà xưởng 125 kW",
    image: "/images/template-10/storage.webp",
    powerKw: 125,
    quoteOnly: true,
    warranty: "5 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Công suất AC": "125 kW",
      Pha: "3 pha",
      "Giám sát": "Ứng dụng trực tuyến",
    },
    compatible: ["tam-pin-585w"],
    isDemo: true,
  },
  {
    slug: "bien-tan-50kw",
    category: "inverter",
    brand: "Nhãn thiết bị D",
    name: "Biến tần cửa hàng 50 kW",
    image: "/images/template-10/storage.webp",
    powerKw: 50,
    price: 68500000,
    warranty: "5 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Công suất AC": "50 kW",
      Pha: "3 pha",
      "Giám sát": "Tập trung nhiều điểm",
    },
    compatible: ["tam-pin-580w"],
    isDemo: true,
  },
  {
    slug: "bien-tan-hybrid-10kw",
    category: "inverter",
    brand: "Nhãn thiết bị E",
    name: "Biến tần hybrid 10 kW",
    image: "/images/template-10/storage.webp",
    powerKw: 10,
    price: 42500000,
    warranty: "5 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Công suất": "10 kW",
      Kiểu: "Hybrid 3 pha",
      "Dự phòng": "Cần pin và mạch tải ưu tiên",
    },
    compatible: ["pin-luu-tru-14kwh"],
    isDemo: true,
  },
  {
    slug: "pin-luu-tru-14kwh",
    category: "battery",
    brand: "Nhãn thiết bị F",
    name: "Pin lưu trữ 14 kWh",
    image: "/images/template-10/storage.webp",
    powerKw: 14,
    quoteOnly: true,
    warranty: "10 năm theo điều kiện thiết bị",
    datasheet: "",
    specs: {
      "Dung lượng mẫu": "14 kWh",
      "Công nghệ": "LiFePO4",
      "Ứng dụng": "Lưu trữ và dự phòng",
    },
    compatible: ["bien-tan-hybrid-10kw"],
    isDemo: true,
  },
  {
    slug: "bo-dau-noi-dc",
    category: "accessory",
    brand: "Nhãn thiết bị G",
    name: "Bộ đầu nối điện một chiều",
    image: "/images/template-10/technicians.webp",
    powerKw: 0,
    price: 390000,
    warranty: "Theo lô hàng",
    datasheet: "",
    specs: {
      "Ứng dụng": "Chuỗi điện một chiều",
      "Lắp đặt": "Kỹ thuật viên",
      "Yêu cầu": "Dụng cụ phù hợp",
    },
    compatible: [],
    isDemo: true,
  },
];

export type Segment = "factory" | "retail" | "home";
export type Region = "north" | "central" | "south";
export const SEGMENT_IDS: Segment[] = ["factory", "retail", "home"];
export const IMAGES = {
  factory: {
    src: "/images/template-10/factory.webp",
    alt: "Ảnh minh họa nhà máy có tấm pin điện mặt trời phủ trên mái",
  },
  farm: {
    src: "/images/template-10/farm.webp",
    alt: "Ảnh minh họa trang trại gà có pin điện mặt trời trên mái chuồng",
  },
  retail: {
    src: "/images/template-10/retail.webp",
    alt: "Ảnh minh họa cửa hàng tiện lợi Việt Nam với pin trên mái",
  },
  coffee: {
    src: "/images/template-10/coffee.webp",
    alt: "Ảnh minh họa quán cà phê có mái lắp điện mặt trời",
  },
  home: {
    src: "/images/template-10/home.webp",
    alt: "Ảnh minh họa nhà phố Việt Nam có điện mặt trời áp mái",
  },
  neighborhood: {
    src: "/images/template-10/neighborhood.webp",
    alt: "Ảnh minh họa khu dân cư nhìn từ trên cao với pin trên mái nhà",
  },
  technicians: {
    src: "/images/template-10/technicians.webp",
    alt: "Ảnh minh họa kỹ thuật viên mang đồ bảo hộ lắp pin trên mái nhà xưởng",
  },
  storage: {
    src: "/images/template-10/storage.webp",
    alt: "Ảnh minh họa inverter và pin lưu trữ trong phòng kỹ thuật",
  },
} as const;
export const SEGMENTS = {
  factory: {
    isDemo: true,
    label: "Nhà máy",
    fullLabel: "Nhà máy, xí nghiệp & trang trại",
    slug: "nha-may",
    image: IMAGES.factory,
    headline: "Biến mái nhà xưởng thành lợi thế về chi phí điện.",
    description:
      "Từ nhà máy phân bón, kho lạnh đến trang trại gà: thiết kế theo phụ tải, có báo cáo tài chính và trách nhiệm vận hành rõ ràng.",
    highlights: [
      "Giảm 20–40% chi phí điện*",
      "Hoàn vốn khoảng 4–6 năm*",
      "ESCO: 0 đồng đầu tư ban đầu*",
    ],
    cta: "Nhận khảo sát & báo cáo tài chính miễn phí",
    secondaryCta: "Tính hiệu quả đầu tư",
    pains: [
      "Hóa đơn điện cao, phụ tải tăng trong giờ sản xuất.",
      "Mái xưởng và chuồng trại hấp nhiệt, làm tăng nhu cầu làm mát.",
      "Đối tác xuất khẩu cần dữ liệu giảm phát thải phục vụ ESG.",
    ],
    solution:
      "Khảo sát tải điện và kết cấu mái, mô phỏng sản lượng theo ca vận hành, triển khai theo khu vực để hạn chế gián đoạn sản xuất. Theo dõi sản lượng và ước tính CO₂ phục vụ báo cáo ESG.",
    benefits: [
      {
        value: "20–40%",
        title: "Giảm chi phí điện",
        text: "Ưu tiên điện tự dùng vào giờ cao điểm của phụ tải; phụ thuộc lịch vận hành và biểu giá.",
      },
      {
        value: "0 đồng*",
        title: "Lựa chọn thuê mái–ESCO",
        text: "Đối tác đầu tư theo hợp đồng, phù hợp mái lớn và phụ tải ổn định; cần xét điều kiện dự án.",
      },
      {
        value: "4–6 năm*",
        title: "Hoàn vốn có cơ sở",
        text: "Báo cáo dòng tiền, sản lượng, chi phí bảo trì và giả định đầu tư trước khi quyết định.",
      },
      {
        value: "CO₂",
        title: "Hỗ trợ báo cáo ESG",
        text: "Ước tính giảm phát thải và xuất dữ liệu phục vụ yêu cầu đối tác xuất khẩu; không thay chứng nhận độc lập.",
      },
      {
        value: "Mái mát hơn",
        title: "Nhà xưởng & chuồng trại",
        text: "Tấm pin tạo lớp che nắng; mức giảm nhiệt cần khảo sát và đo theo công trình.",
      },
    ],
    faq: [
      [
        "Có phải dừng nhà máy để lắp đặt không?",
        "Có thể chia khu vực thi công theo kế hoạch an toàn. Các thời điểm đấu nối cần thống nhất với bộ phận vận hành.",
      ],
      [
        "ESCO 0 đồng đầu tư hoạt động thế nào?",
        "Đối tác đầu tư và vận hành theo thỏa thuận. Điều kiện mái, phụ tải, thời hạn, giá điện và quyền sở hữu được xác định trong hợp đồng.",
      ],
      [
        "CO₂ trên báo cáo có phải chứng nhận ESG không?",
        "Không. Đây là ước tính theo sản lượng và hệ số tham khảo. Báo cáo hoặc chứng nhận chính thức cần phương pháp và thẩm tra phù hợp.",
      ],
    ],
    metaTitle: "Điện mặt trời nhà máy & trang trại | Giảm chi phí vận hành",
    metaDescription:
      "Giải pháp điện mặt trời cho nhà máy, kho lạnh và trang trại: khảo sát mái, tối ưu điện tự dùng, báo cáo tài chính và phương án thuê mái–ESCO.",
  },
  retail: {
    isDemo: true,
    label: "Cửa hàng",
    fullLabel: "Cửa hàng & chuỗi cửa hàng",
    slug: "chuoi-cua-hang",
    image: IMAGES.retail,
    headline: "Một giải pháp điện mặt trời. Đồng bộ cả chuỗi cửa hàng.",
    description:
      "Bách hóa, cà phê, nhà thuốc: tận dụng nắng trong giờ kinh doanh, quản lý điện năng tập trung và bảo trì qua một đầu mối.",
    highlights: [
      "Phát điện đúng giờ kinh doanh",
      "Giám sát tập trung toàn chuỗi",
      "Một đầu mối triển khai & bảo trì",
    ],
    cta: "Tư vấn giải pháp cho chuỗi",
    secondaryCta: "Ước tính tiết kiệm cho cửa hàng",
    pains: [
      "Điều hòa và tủ mát chạy liên tục ban ngày, đẩy chi phí từng điểm bán lên cao.",
      "Nhiều cửa hàng khó kiểm soát hiệu quả và phát hiện sự cố.",
      "Thi công, bảo trì riêng lẻ khiến chất lượng và tiến độ thiếu đồng bộ.",
    ],
    solution:
      "Khảo sát theo mẫu cho từng loại điểm bán, triển khai thí điểm rồi nhân rộng. Một bảng giám sát tổng hợp sản lượng, tiêu thụ và cảnh báo cho toàn chuỗi.",
    benefits: [
      {
        value: "Ban ngày",
        title: "Trùng giờ kinh doanh",
        text: "Sản lượng điện mặt trời ưu tiên cấp cho điều hòa, tủ mát và thiết bị tại điểm bán.",
      },
      {
        value: "24/7",
        title: "Giám sát toàn chuỗi",
        text: "Theo dõi sản lượng, trạng thái và cảnh báo trên một giao diện; phụ thuộc kết nối mạng.",
      },
      {
        value: "1 đầu mối",
        title: "Triển khai & bảo trì",
        text: "Kế hoạch đồng loạt, thiết bị và quy trình thống nhất; giảm việc điều phối nhiều nhà thầu.",
      },
      {
        value: "Thương hiệu xanh",
        title: "Hiệu quả dễ truyền thông",
        text: "Minh bạch dữ liệu năng lượng tại điểm bán, củng cố hình ảnh kinh doanh có trách nhiệm.",
      },
    ],
    faq: [
      [
        "Mỗi cửa hàng có cần cùng một công suất?",
        "Không. Công suất được tính theo mái, hóa đơn và tải ban ngày của từng điểm bán, sau đó quản lý tập trung.",
      ],
      [
        "Có thể làm thử trước khi triển khai toàn chuỗi?",
        "Có thể chọn một số cửa hàng đại diện để đo hiệu quả, hoàn thiện quy trình rồi nhân rộng.",
      ],
      [
        "Mất mạng có mất dữ liệu giám sát không?",
        "Khả năng lưu và đồng bộ lại phụ thuộc thiết bị. Cần xác nhận cấu hình lưu trữ dữ liệu trước khi bàn giao.",
      ],
    ],
    metaTitle: "Điện mặt trời chuỗi cửa hàng | Giám sát & bảo trì tập trung",
    metaDescription:
      "Điện mặt trời cho bách hóa, cà phê và nhà thuốc: tối ưu tải ban ngày, triển khai đồng loạt và giám sát điện năng toàn chuỗi.",
  },
  home: {
    isDemo: true,
    label: "Gia đình",
    fullLabel: "Hộ gia đình & khu dân cư",
    slug: "ho-gia-dinh",
    image: IMAGES.home,
    headline: "Nhà đón nắng. Gia đình nhẹ hóa đơn điện.",
    description:
      "Điện mặt trời áp mái và hệ hybrid có pin lưu trữ, giúp dùng điện chủ động hơn, theo dõi dễ dàng qua ứng dụng.",
    highlights: [
      "Giảm hóa đơn điện bậc thang",
      "Hybrid dự phòng khi cúp điện",
      "Trả góp 0% theo chương trình*",
    ],
    cta: "Tính tiền tiết kiệm ngay",
    secondaryCta: "Nhận khảo sát miễn phí",
    pains: [
      "Điều hòa, thiết bị bếp và sinh hoạt tăng hóa đơn lên các bậc giá cao.",
      "Cúp điện làm gián đoạn thiết bị thiết yếu và công việc tại nhà.",
      "Khó chọn công suất, pin lưu trữ và phương án thanh toán phù hợp.",
    ],
    solution:
      "Đo tải ban ngày, kiểm tra mái và lựa chọn hòa lưới hoặc hybrid. Pin lưu trữ được tính cho nhóm tải thiết yếu và thời gian dự phòng thực tế, theo dõi qua ứng dụng.",
    benefits: [
      {
        value: "Điện tự dùng",
        title: "Giảm hóa đơn bậc thang",
        text: "Giảm điện mua từ lưới vào ban ngày. Máy tính dùng giá bình quân demo, không thay cách tính hóa đơn bậc thang thực tế.",
      },
      {
        value: "Hybrid",
        title: "Dự phòng khi cúp điện",
        text: "Hệ có pin lưu trữ và mạch dự phòng cấp điện cho tải ưu tiên theo dung lượng thiết kế.",
      },
      {
        value: "0%*",
        title: "Trả góp linh hoạt",
        text: "Lãi suất 0% chỉ theo chương trình đối tác và điều kiện hồ sơ; cần làm rõ phí, kỳ hạn và tổng chi phí.",
      },
      {
        value: "25 năm*",
        title: "Bảo hành hiệu suất tấm pin",
        text: "Theo chính sách thiết bị được chọn; bảo hành sản phẩm, inverter, pin lưu trữ và thi công có thời hạn riêng.",
      },
      {
        value: "Qua ứng dụng",
        title: "Theo dõi mỗi ngày",
        text: "Xem điện sinh ra, tiêu thụ và lưu trữ trên điện thoại với thiết bị và kết nối phù hợp.",
      },
    ],
    faq: [
      [
        "Điện mặt trời có hoạt động khi cúp điện?",
        "Hệ hòa lưới thông thường ngắt để bảo đảm an toàn. Muốn dự phòng cần hệ hybrid có pin lưu trữ và mạch cấp điện cho tải ưu tiên.",
      ],
      [
        "Bảo hành 25 năm có áp dụng toàn bộ hệ thống?",
        "Không. Đây là bảo hành hiệu suất tấm pin theo chính sách hãng. Mỗi phần còn lại có phạm vi và thời hạn riêng trong hợp đồng.",
      ],
      [
        "Trả góp 0% có thêm phí không?",
        "Phí và điều kiện phụ thuộc chương trình đối tác. Báo giá cần ghi lãi suất, phí, kỳ hạn và tổng tiền phải trả trước khi ký.",
      ],
    ],
    metaTitle: "Điện mặt trời hộ gia đình | Hybrid lưu trữ & tiết kiệm",
    metaDescription:
      "Điện mặt trời cho nhà phố và khu dân cư, pin lưu trữ dự phòng, theo dõi qua ứng dụng và máy tính tiết kiệm tham khảo.",
  },
} as const;

export const HOME_COPY = {
  eyebrow: "Điện mặt trời cho nhà máy • cửa hàng • gia đình",
  headline: "Biến điện năng thành giá trị cho mỗi công trình.",
  description:
    "Một mái nhà, một bài toán riêng. Chọn giải pháp phù hợp để giảm chi phí điện, chủ động năng lượng và nhìn rõ hiệu quả đầu tư.",
  highlights: [
    "Khảo sát theo nhu cầu thực tế",
    "Báo cáo hiệu quả minh bạch",
    "Đồng hành sau bàn giao",
  ],
  cta: "Nhận khảo sát miễn phí",
  secondaryCta: "Tính tiền tiết kiệm",
  selector: "Bạn là:",
  chips: ["Tấm pin hiệu suất cao", "Inverter & giám sát", "Pin lưu trữ hybrid"],
  heroMetric: {
    label: "Điện tự dùng",
    value: "Ưu tiên tải ban ngày",
    note: "Thiết kế theo phụ tải",
  },
} as const;
export const CLIENTS = [
  {
    id: "dong-xanh",
    name: "Nhà máy Phân bón Đồng Xanh",
    shortName: "ĐỒNG XANH",
    segment: "factory",
    industry: "Sản xuất",
    location: "Long An",
    scale: "1,2 MWp",
    color: "#176746",
    isDemo: true,
  },
  {
    id: "phu-an",
    name: "Trang trại gà công nghiệp Phú An",
    shortName: "PHÚ AN",
    segment: "factory",
    industry: "Nông nghiệp",
    location: "Bình Phước",
    scale: "850 kWp",
    color: "#935e16",
    isDemo: true,
  },
  {
    id: "tan-phat",
    name: "Nhà máy Chế biến gỗ Tân Phát",
    shortName: "TÂN PHÁT",
    segment: "factory",
    industry: "Sản xuất",
    location: "Bình Dương",
    scale: "1,5 MWp",
    color: "#754434",
    isDemo: true,
  },
  {
    id: "bien-bac",
    name: "Kho lạnh Thủy sản Biển Bạc",
    shortName: "BIỂN BẠC",
    segment: "factory",
    industry: "Kho lạnh",
    location: "Cần Thơ",
    scale: "600 kWp",
    color: "#196a8a",
    isDemo: true,
  },
  {
    id: "hoa-binh",
    name: "Xưởng May Hòa Bình",
    shortName: "HÒA BÌNH",
    segment: "factory",
    industry: "Sản xuất",
    location: "Đồng Nai",
    scale: "900 kWp",
    color: "#704697",
    isDemo: true,
  },
  {
    id: "cam",
    name: "Chuỗi Bách hóa Cam",
    shortName: "BÁCH HÓA CAM",
    segment: "retail",
    industry: "Bán lẻ",
    location: "TP. Hồ Chí Minh",
    scale: "35 cửa hàng",
    color: "#ad491a",
    isDemo: true,
  },
  {
    id: "drinking",
    name: "Chuỗi cà phê Drinking",
    shortName: "DRINKING",
    segment: "retail",
    industry: "Bán lẻ",
    location: "TP. Hồ Chí Minh",
    scale: "20 điểm",
    color: "#6b4c3b",
    isDemo: true,
  },
  {
    id: "an-tam",
    name: "Chuỗi Nhà thuốc An Tâm",
    shortName: "AN TÂM",
    segment: "retail",
    industry: "Bán lẻ",
    location: "Đồng Nai",
    scale: "18 điểm",
    color: "#21599c",
    isDemo: true,
  },
  {
    id: "gao-vang",
    name: "Siêu thị Mini Gạo Vàng",
    shortName: "GẠO VÀNG",
    segment: "retail",
    industry: "Bán lẻ",
    location: "Long An",
    scale: "Điểm bán mẫu",
    color: "#886414",
    isDemo: true,
  },
  {
    id: "vuon-sen",
    name: "Khu dân cư Vườn Sen",
    shortName: "VƯỜN SEN",
    segment: "home",
    industry: "Khu dân cư",
    location: "Đồng Tháp",
    scale: "120 hộ",
    color: "#9a426e",
    isDemo: true,
  },
  {
    id: "phu-gia",
    name: "Khu đô thị Phú Gia Garden",
    shortName: "PHÚ GIA GARDEN",
    segment: "home",
    industry: "Khu dân cư",
    location: "Long An",
    scale: "Khu dân cư mẫu",
    color: "#347267",
    isDemo: true,
  },
] satisfies {
  id: string;
  name: string;
  shortName: string;
  segment: Segment;
  industry: string;
  location: string;
  scale: string;
  color: string;
  isDemo: boolean;
}[];
export const PARTNERS = Array.from({ length: 8 }, (_, index) => ({
  id: `partner-${index}`,
  label: "Logo đối tác",
  logo: "", // Điền đường dẫn logo thật có quyền sử dụng.
  category: index < 5 ? "Thiết bị" : "Tài chính",
  isDemo: true,
}));
export const CASE_STUDIES = [
  {
    slug: "phan-bon-dong-xanh",
    segment: "factory",
    name: CLIENTS[0].name,
    industry: "Nhà máy phân bón",
    province: "Long An",
    kwp: 1200,
    savingPercent: 32,
    paybackYears: 5.1,
    image: IMAGES.factory,
    quote:
      "Báo cáo tải theo ca giúp chúng tôi hiểu rõ hiệu quả trước khi quyết định.",
    detail:
      "Ưu tiên điện tự dùng cho dây chuyền và quạt vận hành ban ngày. Thi công từng vùng mái theo kế hoạch an toàn, kết hợp theo dõi hiệu suất sau bàn giao.",
    isDemo: true,
  },
  {
    slug: "trang-trai-phu-an",
    segment: "factory",
    name: CLIENTS[1].name,
    industry: "Trang trại gà công nghiệp",
    province: "Bình Phước",
    kwp: 850,
    savingPercent: 29,
    paybackYears: 5.6,
    image: IMAGES.farm,
    quote:
      "Điện tự dùng cấp cho quạt và làm mát, đội bảo trì có lịch làm việc rõ ràng.",
    detail:
      "Thiết kế cho tải thông gió và làm mát chuồng trại; phân nhóm tải quan trọng và khảo sát nhu cầu dự phòng riêng.",
    isDemo: true,
  },
  {
    slug: "bach-hoa-cam",
    segment: "retail",
    name: CLIENTS[5].name,
    industry: "Chuỗi bách hóa",
    province: "TP. Hồ Chí Minh",
    kwp: 350,
    savingPercent: 28,
    paybackYears: 5.2,
    image: IMAGES.retail,
    quote: "Một bảng giám sát cho cả chuỗi giúp đội vận hành chủ động hơn.",
    detail:
      "Công suất 350 kWp là tổng toàn chuỗi 35 điểm bán mẫu. Thí điểm tại cửa hàng đại diện trước khi triển khai đồng bộ cho các mái phù hợp.",
    isDemo: true,
  },
  {
    slug: "ca-phe-drinking",
    segment: "retail",
    name: CLIENTS[6].name,
    industry: "Chuỗi cà phê",
    province: "TP. Hồ Chí Minh",
    kwp: 180,
    savingPercent: 26,
    paybackYears: 5.8,
    image: IMAGES.coffee,
    quote:
      "Giờ có nắng cũng là giờ điều hòa và thiết bị phục vụ khách chạy nhiều.",
    detail:
      "Tổng công suất mẫu tại 20 điểm bán; lựa chọn lịch lắp đặt để hạn chế ảnh hưởng giờ phục vụ khách, một đầu mối bảo trì toàn chuỗi.",
    isDemo: true,
  },
  {
    slug: "nha-pho-vuon-sen",
    segment: "home",
    name: "Nhà phố mẫu tại Vườn Sen",
    industry: "Hộ gia đình",
    province: "Đồng Tháp",
    kwp: 6,
    savingPercent: 34,
    paybackYears: 6.2,
    image: IMAGES.home,
    quote:
      "Xem được lượng điện mỗi ngày trên điện thoại nên gia đình dễ điều chỉnh thói quen.",
    detail:
      "Hệ áp mái 6 kWp cho một hộ mẫu. Công suất pin lưu trữ và nhóm tải dự phòng được tính riêng, không bao gồm trong hoàn vốn tham khảo của hệ hòa lưới.",
    isDemo: true,
  },
  {
    slug: "khu-dan-cu-vuon-sen",
    segment: "home",
    name: CLIENTS[9].name,
    industry: "Khu dân cư",
    province: "Đồng Tháp",
    kwp: 600,
    savingPercent: 30,
    paybackYears: 6.5,
    image: IMAGES.neighborhood,
    quote:
      "Quy trình khảo sát và bàn giao thống nhất giúp các hộ dân dễ theo dõi hệ thống.",
    detail:
      "Tổng công suất mẫu của 120 hộ; mỗi hộ khảo sát tải và mái riêng. Số liệu tổng hợp chỉ minh họa cách trình bày một chương trình triển khai tại khu dân cư.",
    isDemo: true,
  },
] satisfies {
  slug: string;
  segment: Segment;
  name: string;
  industry: string;
  province: string;
  kwp: number;
  savingPercent: number;
  paybackYears: number;
  image: { src: string; alt: string };
  quote: string;
  detail: string;
  isDemo: boolean;
}[];
export const COUNTERS = [
  {
    value: 38.6,
    decimals: 1,
    unit: "MWp",
    label: "Công suất đã lắp đặt",
    isDemo: true,
  },
  {
    value: 286,
    decimals: 0,
    unit: "dự án",
    label: "Công trình triển khai",
    isDemo: true,
  },
  {
    value: 28500,
    decimals: 0,
    unit: "tấn CO₂/năm",
    label: "Phát thải giảm ước tính",
    isDemo: true,
  },
  {
    value: 18,
    decimals: 0,
    unit: "tỉnh thành",
    label: "Phạm vi phục vụ",
    isDemo: true,
  },
];
export const REVIEWS = [
  {
    segment: "factory",
    name: "Nguyễn Minh Khang",
    role: "Quản lý vận hành",
    company: CLIENTS[0].name,
    avatar: "/images/template-10/avatar-factory.webp",
    text: CASE_STUDIES[0].quote,
    isDemo: true,
  },
  {
    segment: "retail",
    name: "Trần Ngọc Linh",
    role: "Quản lý chuỗi",
    company: CLIENTS[5].name,
    avatar: "/images/template-10/avatar-retail.webp",
    text: CASE_STUDIES[2].quote,
    isDemo: true,
  },
  {
    segment: "home",
    name: "Võ Hoàng Nam",
    role: "Đại diện hộ gia đình",
    company: "Nhà phố mẫu tại Vườn Sen",
    avatar: "/images/template-10/avatar-home.webp",
    text: CASE_STUDIES[4].quote,
    isDemo: true,
  },
  {
    segment: "factory",
    name: "Lê Quốc Sơn",
    role: "Quản lý trang trại",
    company: CLIENTS[1].name,
    avatar: "/images/template-10/avatar-factory.webp",
    text: CASE_STUDIES[1].quote,
    isDemo: true,
  },
  {
    segment: "retail",
    name: "Phạm Mai Anh",
    role: "Phụ trách vận hành",
    company: CLIENTS[6].name,
    avatar: "/images/template-10/avatar-retail.webp",
    text: CASE_STUDIES[3].quote,
    isDemo: true,
  },
  {
    segment: "home",
    name: "Trần Hữu Phúc",
    role: "Đại diện cư dân",
    company: CLIENTS[9].name,
    avatar: "/images/template-10/avatar-home.webp",
    text: CASE_STUDIES[5].quote,
    isDemo: true,
  },
] satisfies {
  segment: Segment;
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  isDemo: boolean;
}[];
export const FINANCE = [
  {
    name: "Mua đứt",
    investment: "Thanh toán theo tiến độ",
    ownership: "Khách hàng sở hữu hệ thống",
    advantage: "Chủ động thiết bị và toàn bộ điện tự dùng",
    suitable: "Có ngân sách và mục tiêu đầu tư dài hạn",
    note: "Chi phí theo hiện trạng mái, công suất và thiết bị.",
    isDemo: true,
  },
  {
    name: "Trả góp",
    investment: "Chia khoản đầu tư theo kỳ",
    ownership: "Theo hợp đồng tài chính",
    advantage: "Chương trình lãi suất 0% nếu đủ điều kiện",
    suitable: "Gia đình hoặc doanh nghiệp cần cân đối dòng tiền",
    note: "Xác nhận lãi suất, phí, kỳ hạn và tổng chi phí với đối tác.",
    isDemo: true,
  },
  {
    name: "Thuê mái–ESCO",
    investment: "Có thể 0 đồng đầu tư ban đầu",
    ownership: "Đối tác đầu tư theo thỏa thuận",
    advantage: "Sử dụng điện theo hợp đồng, giảm áp lực vốn",
    suitable: "Nhà máy, trang trại, mái lớn và phụ tải ổn định",
    note: "Cần thẩm định mái, phụ tải, quyền sử dụng và thời hạn hợp đồng.",
    isDemo: true,
  },
];
export const PROCESS_STEPS = [
  {
    title: "Khảo sát",
    text: "Hóa đơn, phụ tải, kết cấu mái và điều kiện thi công.",
  },
  {
    title: "Thiết kế & báo giá",
    text: "Mô phỏng sản lượng, lựa chọn thiết bị và phân tích tài chính.",
  },
  {
    title: "Ký hợp đồng",
    text: "Chốt phạm vi, tiến độ, thanh toán và trách nhiệm bảo hành.",
  },
  {
    title: "Lắp đặt",
    text: "Thi công theo kế hoạch an toàn và kiểm tra từng hạng mục.",
  },
  {
    title: "Đấu nối & nghiệm thu",
    text: "Đo kiểm, cấu hình hệ thống, hướng dẫn và bàn giao hồ sơ.",
  },
  {
    title: "Giám sát & bảo trì",
    text: "Theo dõi sản lượng, cảnh báo, vệ sinh và bảo trì định kỳ.",
  },
];
export const TRUST_BADGES = [
  {
    title: "Bảo hành 25 năm*",
    text: "Hiệu suất tấm pin theo chính sách thiết bị.",
  },
  { title: "Thiết bị Tier 1*", text: "Lựa chọn theo hồ sơ và yêu cầu dự án." },
  {
    title: "Bảo hiểm công trình*",
    text: "Phạm vi và mức bảo hiểm theo hợp đồng.",
  },
  {
    title: "Đội kỹ thuật được chứng nhận*",
    text: "Hồ sơ chứng nhận cần được cung cấp khi báo giá.",
  },
];
// Hệ số DEMO, cần thay bằng dữ liệu dự án/địa phương. Không phải biểu giá điện chính thức.
export const CALCULATOR = {
  isDemo: true,
  daysPerMonth: 30,
  monthsPerYear: 12,
  performanceRatio: 0.8,
  roofM2PerKwp: 6,
  co2KgPerKwh: 0.65,
  annualMaintenanceRate: 0.01,
  minKwp: 1,
  maxKwp: 10000,
  limits: {
    bill: { min: 100000, max: 10000000000 },
    roof: { min: 6, max: 60000 },
  },
  regions: {
    north: { label: "Miền Bắc", sunHours: 3.4 },
    central: { label: "Miền Trung", sunHours: 4.2 },
    south: { label: "Miền Nam", sunHours: 4.7 },
  },
  segments: {
    factory: {
      electricityRate: 2850,
      costPerKwp: 13500000,
      selfUse: 0.9,
      targetSaving: 0.35,
      defaultBill: 200000000,
      defaultRoof: 1200,
    },
    retail: {
      electricityRate: 3150,
      costPerKwp: 14500000,
      selfUse: 0.85,
      targetSaving: 0.35,
      defaultBill: 12000000,
      defaultRoof: 150,
    },
    home: {
      electricityRate: 3050,
      costPerKwp: 16000000,
      selfUse: 0.7,
      targetSaving: 0.35,
      defaultBill: 3000000,
      defaultRoof: 60,
    },
  },
};
export const DASHBOARD = {
  isDemo: true,
  title: "Mọi chỉ số năng lượng đều nằm trong tầm mắt",
  eyebrow: "Theo dõi điện năng 24/7",
  description:
    "Sản lượng, tiêu thụ và lưu trữ trên một giao diện. Theo dõi từng nhà máy hoặc toàn chuỗi, nhận cảnh báo để đội kỹ thuật xử lý kịp thời.",
  badge: "Giao diện minh họa • dữ liệu demo",
  chartTitle: "Sản lượng & tiêu thụ trong ngày",
  chartAlt:
    "Biểu đồ mẫu: điện mặt trời đạt đỉnh buổi trưa, tiêu thụ kéo dài trong giờ vận hành.",
  productionLabel: "Điện mặt trời",
  consumptionLabel: "Tiêu thụ",
  storageLabel: "Lưu trữ",
  production: [
    0, 0, 0, 0, 0, 8, 24, 52, 90, 125, 160, 182, 186, 175, 148, 106, 66, 28, 5,
    0, 0, 0, 0, 0,
  ],
  consumption: [
    32, 30, 28, 30, 34, 42, 70, 110, 148, 155, 165, 158, 142, 153, 162, 158,
    147, 128, 86, 64, 55, 45, 39, 34,
  ],
  stats: [
    { label: "Sản lượng hôm nay", value: "1.248 kWh" },
    { label: "Tự dùng", value: "91%" },
    { label: "Pin lưu trữ", value: "78%" },
  ],
  sites: [
    { name: "Điểm vận hành 01", value: "Vận hành ổn định" },
    { name: "Điểm vận hành 02", value: "Vận hành ổn định" },
    { name: "Điểm vận hành 03", value: "Đã lên lịch kiểm tra" },
  ],
};
export const FAQS = [
  [
    "Công suất nào phù hợp với công trình của tôi?",
    "Cần đối chiếu hóa đơn, tải ban ngày, diện tích và kết cấu mái. Máy tính chỉ giúp ước tính ban đầu, khảo sát sẽ xác định cấu hình thực tế.",
  ],
  [
    "Có thể bán điện dư lên lưới không?",
    "Khả năng áp dụng và điều kiện bán điện dư cần được kiểm tra theo cơ chế đang có hiệu lực tại thời điểm triển khai. Máy tính ở đây không tính doanh thu điện dư.",
  ],
  [
    "Bao lâu cần vệ sinh và bảo trì?",
    "Tùy môi trường, góc mái và dữ liệu sản lượng. Lịch bảo trì và trách nhiệm xử lý cần được ghi rõ trong hợp đồng.",
  ],
  [
    "Các số liệu trên website có phải dự án thật không?",
    "Không. Tên khách hàng, nhận xét, công suất, tài chính và hình ảnh đều là dữ liệu demo hoặc ảnh minh họa, cần thay bằng hồ sơ có thể xác minh.",
  ],
] as const;
export const POLICY_SUMMARY = [FAQS[1][1]];
export const TEAM = REVIEWS.slice(0, 3).map((r) => ({
  name: r.name,
  role: "Nhân sự minh họa",
  image: r.avatar,
  isDemo: true,
}));
export const TESTIMONIALS = REVIEWS.map((r) => ({
  company: r.company,
  person: r.name,
  text: r.text,
  rating: "Nhận xét minh họa",
  isDemo: true,
}));
export const PROJECTS = CASE_STUDIES.map((c) => ({
  slug: c.slug,
  title: c.name,
  type: c.industry,
  location: c.province,
  capacity: `${c.kwp} kWp`,
  image: c.image.src,
  saving: `${c.savingPercent}% chi phí điện`,
  selfUse: "Theo khảo sát",
  detail: c.detail,
  metrics: [
    ["Công suất", `${c.kwp} kWp`],
    ["Tiết kiệm", `${c.savingPercent}%`],
    ["Hoàn vốn", `${c.paybackYears} năm`],
    ["Tỉnh", c.province],
  ],
  isDemo: true,
}));
export const SERVICES = SEGMENT_IDS.map((id) => ({
  slug: SEGMENTS[id].slug,
  title: SEGMENTS[id].fullLabel,
  audience: SEGMENTS[id].label,
  problem: SEGMENTS[id].pains[0],
  solution: SEGMENTS[id].solution,
  image: SEGMENTS[id].image.src,
  price: "Báo giá theo khảo sát",
  packages: [
    ["Khảo sát", "Miễn phí theo phạm vi tư vấn"],
    ["Thiết kế", "Theo hiện trạng công trình"],
    ["Bảo trì", "Theo hợp đồng"],
  ],
  isDemo: true,
}));
export const ARTICLES = [
  {
    id: "1",
    title: "Chuẩn bị gì trước buổi khảo sát điện mặt trời?",
    description:
      "Hóa đơn điện, lịch sử phụ tải, bản vẽ mái và mục tiêu đầu tư giúp buổi khảo sát có dữ liệu rõ ràng.",
    image: IMAGES.technicians,
    paragraphs: [
      "Chuẩn bị hóa đơn điện và lịch vận hành để hiểu lượng điện tự dùng ban ngày. Diện tích mái chỉ là một phần; tuổi mái, kết cấu và bóng che cũng cần kiểm tra.",
      "Báo giá nên đi cùng giả định sản lượng, chi phí bảo trì và trách nhiệm bảo hành. Tất cả con số trên mẫu này là minh họa, không phải cam kết thương mại.",
    ],
    isDemo: true,
  },
  {
    id: "2",
    title: "Hòa lưới hay hybrid có pin lưu trữ?",
    description:
      "Chọn theo nhu cầu điện tự dùng và tải cần duy trì khi mất điện.",
    image: IMAGES.storage,
    paragraphs: [
      "Hệ hòa lưới thông thường ngắt khi mất điện để bảo đảm an toàn. Hệ hybrid cần pin lưu trữ và mạch dự phòng được thiết kế cho nhóm tải ưu tiên.",
      "Chi phí pin và tuổi thọ cần được xét riêng. Máy tính trên website ước tính hệ điện mặt trời tự dùng, chưa bao gồm lưu trữ.",
    ],
    isDemo: true,
  },
  {
    id: "3",
    title: "Đọc báo cáo hiệu quả cho chuỗi cửa hàng",
    description:
      "Đối chiếu sản lượng, điện tự dùng và trạng thái từng điểm bán trên cùng một giao diện.",
    image: IMAGES.coffee,
    paragraphs: [
      "Mỗi điểm bán có mái và tải khác nhau. Nên làm thí điểm tại cửa hàng đại diện, theo dõi dữ liệu rồi triển khai đồng bộ.",
      "Báo cáo theo chuỗi cần cho phép kiểm tra từng điểm bán và nhận cảnh báo. Dashboard trong template là giao diện tĩnh với dữ liệu demo.",
    ],
    isDemo: true,
  },
];
export const COPY = {
  demo: "Dữ liệu demo • tên hư cấu • ảnh minh họa",
  demoShort: "Dữ liệu demo",
  imageNote: "Ảnh minh họa",
  all: "Tất cả",
  allIndustries: "Tất cả ngành",
  allSegments: "Tất cả khách hàng",
  reference: "Kết quả mang tính tham khảo",
  conditions:
    "* Số liệu và điều kiện minh họa; hiệu quả thực tế phụ thuộc khảo sát, phụ tải, thiết bị và hợp đồng.",
  solutionEyebrow: "Giải pháp theo nhu cầu",
  solutionTitle: "Cùng một nguồn nắng. Ba bài toán khác nhau.",
  solutionDescription:
    "Đi thẳng vào nhu cầu của công trình, từ vận hành đến dòng tiền.",
  solutionMore: "Khám phá giải pháp",
  painTitle: "Điều gì đang làm bạn tốn điện?",
  solutionHeading: "Thiết kế bắt đầu từ bài toán vận hành",
  benefitHeading: "Hiệu quả cần nhìn thấy và đo được",
  benefits: "Lợi ích chính",
  clientsEyebrow: "Khách hàng minh họa",
  clientsTitle: "Phù hợp từ mái nhà xưởng đến từng điểm bán.",
  clientsNote:
    "Tên bên dưới được sử dụng làm tên hư cấu theo kịch bản demo; không biểu thị quan hệ với doanh nghiệp có cùng tên ngoài đời.",
  clientsPause: "Tạm dừng chuyển động",
  clientsPlay: "Tiếp tục chuyển động",
  clientsFilter: "Lọc khách hàng theo ngành",
  industries: ["Sản xuất", "Nông nghiệp", "Kho lạnh", "Bán lẻ", "Khu dân cư"],
  partnersTitle: "Đối tác thiết bị & tài chính",
  partnersNote: "Ô nhận diện mẫu, chưa thể hiện quan hệ hợp tác thực tế.",
  caseEyebrow: "Câu chuyện triển khai",
  caseTitle: "Mỗi công trình có một cách tạo giá trị.",
  caseMore: "Xem dự án minh họa",
  saving: "Tiết kiệm",
  payback: "Hoàn vốn",
  capacity: "Công suất",
  years: "năm",
  detailTitle: "Bài toán & cách triển khai",
  quoteTitle: "Lời chia sẻ minh họa",
  similarCta: "Nhận phương án cho công trình tương tự",
  backProjects: "Quay lại dự án",
  counterNote:
    "Số liệu năng lực minh họa, cần thay bằng hồ sơ dự án có thể xác minh.",
  reviewsEyebrow: "Trải nghiệm khách hàng",
  reviewsTitle: "Đồng hành từ khảo sát đến vận hành.",
  prev: "Nhận xét trước",
  next: "Nhận xét tiếp theo",
  reviewFilter: "Lọc nhận xét theo khách hàng",
  reviewPosition: "Nhận xét",
  of: "trên",
  financeEyebrow: "Phương án tài chính",
  financeTitle: "Chọn cách đầu tư phù hợp với dòng tiền.",
  financeLabels: {
    investment: "Vốn ban đầu",
    ownership: "Sở hữu",
    advantage: "Lợi ích",
    suitable: "Phù hợp",
  },
  processEyebrow: "Quy trình 6 bước",
  processTitle: "Rõ từng bước. Yên tâm cả hành trình.",
  trustTitle: "Cam kết cần đi cùng hồ sơ",
  faqEyebrow: "Câu hỏi thường gặp",
  faqTitle: "Hiểu rõ trước khi quyết định.",
  calculator: {
    eyebrow: "Máy tính tiết kiệm",
    title: "Mái nhà của bạn có thể tiết kiệm bao nhiêu?",
    description:
      "Ước tính sơ bộ cho hệ điện mặt trời tự dùng, chưa bao gồm pin lưu trữ, thuế, chi phí tài chính hoặc doanh thu bán điện dư.",
    tabs: "Chọn loại khách hàng cho máy tính",
    inputMode: "Tính theo",
    billMode: "Hóa đơn điện",
    roofMode: "Diện tích mái",
    bill: "Hóa đơn điện/tháng (VNĐ)",
    roof: "Diện tích mái (m²)",
    region: "Khu vực",
    kwp: "Công suất đề xuất",
    monthly: "Tiết kiệm/tháng",
    annual: "Tiết kiệm/năm",
    payback: "Hoàn vốn đơn giản",
    co2: "CO₂ giảm/năm",
    investment: "Đầu tư ước tính",
    quote: "Nhận báo giá chi tiết",
    assumptions: "Giả định đang sử dụng",
    rate: "Giá điện bình quân",
    sun: "Giờ nắng/ngày",
    roofFactor: "Diện tích mái/kWp",
    selfUse: "Tỷ lệ tự dùng",
    cost: "Suất đầu tư/kWp",
    maintenance: "Bảo trì/năm",
    kg: "kg",
    invalid: "Vui lòng nhập một giá trị trong khoảng cho phép.",
    noPayback: "Cần đánh giá lại",
    requestPrefix: "Ước tính điện mặt trời",
    pending: "Tính ước tính",
    roofWarning:
      "Cần xác nhận diện tích mái khả dụng và phụ tải thực tế. Kết quả theo mái chưa giới hạn theo hóa đơn.",
  },
  contact: {
    eyebrow: "Khảo sát miễn phí",
    title: "Bắt đầu từ mái nhà và hóa đơn của bạn.",
    description:
      "Chia sẻ nhu cầu, đội dự án sẽ chuẩn bị phương án cho buổi khảo sát.",
    name: "Họ và tên",
    namePlaceholder: "Tên người liên hệ",
    phone: "Số điện thoại",
    phonePlaceholder: "0708 699 808",
    email: "Email",
    emailPlaceholder: "email@congty.vn",
    company: "Doanh nghiệp / công trình",
    companyPlaceholder: "Tên công ty hoặc địa chỉ công trình",
    segment: "Loại khách hàng",
    general: "Chưa xác định",
    message: "Nhu cầu",
    messagePlaceholder: "Hóa đơn điện, diện tích mái, thiết bị cần dự phòng...",
    submit: "Nhận tư vấn & khảo sát",
    sending: "Đang gửi...",
    success: "Đã gửi thông tin thành công.",
    successText: "Đội dự án sẽ liên hệ theo thông tin bạn đã cung cấp.",
    demoSuccess: "Đã chạy thử form demo.",
    demoSuccessText:
      "Thông tin chưa được lưu hoặc chuyển đến doanh nghiệp. Kết nối dịch vụ nhận yêu cầu trước khi sử dụng thực tế.",
    error: "Chưa gửi được thông tin. Vui lòng thử lại hoặc gọi hotline.",
    invalid: "Vui lòng kiểm tra tên và số điện thoại.",
    consent: "Tôi đồng ý để doanh nghiệp liên hệ về yêu cầu khảo sát này.",
    demoNotice:
      "Form demo: chưa lưu dữ liệu nếu chưa kết nối dịch vụ nhận yêu cầu.",
  },
  shell: {
    demoBanner: "Website mẫu • số liệu demo • nội dung có thể tùy chỉnh",
    hideDemo: "Ẩn thông báo demo",
    navigation: "Điều hướng chính",
    openMenu: "Mở menu",
    survey: "Khảo sát miễn phí",
    call: "Gọi điện",
    solutions: "Giải pháp",
    company: "Công ty",
    contact: "Liên hệ",
    copyright: "Bản mẫu điện mặt trời",
    footerNote:
      "Thông tin minh họa cần thay và xác minh trước khi sử dụng thực tế.",
    skip: "Đến nội dung chính",
    equipment: "Thiết bị",
    news: "Góc tư vấn",
    openQuote: "Mở yêu cầu báo giá",
    quoteTitle: "Yêu cầu báo giá thiết bị",
    close: "Đóng",
    remove: "Bỏ khỏi yêu cầu",
    empty:
      "Chưa chọn thiết bị. Thêm thiết bị để gửi chung một yêu cầu báo giá.",
    continue: "Tiếp tục gửi yêu cầu",
    viewProducts: "Xem thiết bị",
    rfqPrefix: "Yêu cầu báo giá:",
    numberSelected: "Thiết bị đang chọn",
  },
  about: {
    title: "Kỹ thuật vững. Đồng hành lâu dài.",
    description:
      "Khảo sát theo dữ liệu, lắp đặt theo tiêu chuẩn và chăm sóc hệ thống sau bàn giao.",
    storyTitle: "Từ nhu cầu sử dụng đến một hệ thống phù hợp.",
    storyText:
      "Chúng tôi bắt đầu bằng hóa đơn điện, phụ tải và kết cấu mái. Chủ đầu tư nhận được phương án kỹ thuật, tài chính và phạm vi trách nhiệm rõ ràng trước khi quyết định.",
    teamTitle: "Đội ngũ minh họa",
    certificateTitle: "Hồ sơ chứng nhận",
    certificates: [
      "Chứng nhận kỹ thuật: cần cập nhật hồ sơ thật",
      "Bảo hiểm công trình: cần xác nhận phạm vi",
      "Hồ sơ đào tạo và an toàn: cần cập nhật",
    ],
  },
  news: {
    title: "Góc tư vấn điện mặt trời",
    description:
      "Các bài hướng dẫn demo giúp chuẩn bị đầu tư và vận hành hệ thống.",
    read: "Đọc hướng dẫn",
    back: "Quay lại góc tư vấn",
  },
  seo: {
    homeTitle: "Điện mặt trời nhà máy, cửa hàng & gia đình",
    homeDescription:
      "Giải pháp điện mặt trời theo nhu cầu: khảo sát miễn phí, báo cáo hiệu quả đầu tư, máy tính tiết kiệm và phương án tài chính linh hoạt.",
    aboutDescription:
      "Năng lực kỹ thuật, quy trình triển khai và đội ngũ minh họa của doanh nghiệp điện mặt trời.",
    contactDescription:
      "Gửi nhu cầu khảo sát điện mặt trời cho nhà máy, chuỗi cửa hàng và hộ gia đình.",
    businessType: "LocalBusiness",
    areaServed: "Việt Nam",
  },
  notFound: {
    title: "Không tìm thấy trang",
    description:
      "Đường dẫn có thể đã thay đổi. Mời bạn xem các giải pháp điện mặt trời.",
    cta: "Về trang chủ",
  },
};
export const CATALOG_COPY = {
  title: "Chọn thiết bị phù hợp với công trình.",
  description:
    "Danh mục minh họa cho tấm pin, biến tần, pin lưu trữ và phụ kiện. Tất cả thông số, giá và nhận diện thiết bị cần thay bằng hồ sơ thực tế.",
  category: "Loại thiết bị",
  brand: "Nhãn thiết bị",
  allBrands: "Tất cả nhãn",
  minimumPower: "Công suất tối thiểu (kW)",
  maxPrice: "Giá tối đa (VNĐ)",
  sort: "Sắp xếp",
  featured: "Mặc định",
  priceAsc: "Giá tăng dần",
  powerDesc: "Công suất giảm dần",
  reset: "Xóa bộ lọc",
  results: "thiết bị",
  empty: "Chưa có thiết bị phù hợp. Hãy thử thay bộ lọc.",
  quote: "Liên hệ báo giá",
  added: "Đã chọn",
  add: "Thêm vào yêu cầu báo giá",
  detail: "Xem chi tiết",
  back: "Về danh mục thiết bị",
  warranty: "Bảo hành",
  warrantyNote:
    "Điều kiện và phạm vi cần đối chiếu hồ sơ thiết bị và hợp đồng trước khi mua.",
  specs: "Thông số kỹ thuật",
  compatible: "Thiết bị có thể kết hợp",
  compatibilityNote:
    "Độ tương thích cần được kỹ thuật xác nhận theo cấu hình thực tế.",
  datasheet: "Tài liệu kỹ thuật",
  datasheetPending: "Tài liệu kỹ thuật: đang chờ cập nhật",
  loading: "Đang tải danh mục...",
  categories: [
    ["", "Tất cả"],
    ["panel", "Tấm pin"],
    ["inverter", "Biến tần"],
    ["battery", "Pin lưu trữ"],
    ["accessory", "Phụ kiện"],
  ],
};
export const ASSET_COPY = {
  logoAltPrefix: "Logo hư cấu:",
  avatarAltPrefix: "Chân dung minh họa:",
  zalo: "Zalo",
  hourLabels: ["00:00", "12:00", "23:00"],
  profile: "Về chúng tôi",
};
