import type { FieldNode } from "./describe.ts";

/** Nhãn tiếng Việt cho khóa hay gặp; khóa khác tách camelCase. Override theo đường dẫn qua prop `labels` của SchemaForm. */
const LABELS: Record<string, string> = {
  status: "Trạng thái", draft: "Nháp", published: "Đã xuất bản",
  title: "Tiêu đề", subtitle: "Phụ đề", eyebrow: "Dòng nhỏ trên tiêu đề", description: "Mô tả", body: "Nội dung",
  text: "Nội dung", intro: "Giới thiệu", summary: "Tóm tắt", note: "Ghi chú", footnote: "Chú thích cuối", hint: "Gợi ý",
  label: "Nhãn", name: "Tên", items: "Danh sách", item: "Mục", image: "Ảnh", images: "Ảnh", logo: "Logo", icon: "Biểu tượng",
  video: "Video", videos: "Video", poster: "Ảnh bìa", gallery: "Thư viện ảnh", cover: "Ảnh bìa", media: "Ảnh / video",
  cta: "Nút kêu gọi", ctas: "Các nút", primaryCta: "Nút chính", secondaryCta: "Nút phụ", ctaLabel: "Chữ trên nút",
  link: "Liên kết", links: "Liên kết", href: "Đường dẫn", url: "Đường dẫn", phone: "Số điện thoại", hotline: "Hotline",
  zalo: "Zalo", address: "Địa chỉ", email: "Email", price: "Giá", salePrice: "Giá khuyến mãi", unit: "Đơn vị",
  value: "Giá trị", values: "Giá trị", count: "Số lượng", year: "Năm", date: "Ngày", rating: "Điểm đánh giá",
  question: "Câu hỏi", answer: "Trả lời", faqs: "Câu hỏi thường gặp", quote: "Trích dẫn", customer: "Khách hàng",
  highlight: "Phần nhấn mạnh", lead: "Phần đầu", stats: "Số liệu", steps: "Các bước", step: "Bước", features: "Tính năng",
  benefits: "Lợi ích", tag: "Thẻ", category: "Danh mục", categories: "Danh mục", query: "Nguồn dữ liệu", limit: "Số mục",
  enabled: "Bật", featured: "Nổi bật", popular: "Phổ biến", kind: "Loại", type: "Kiểu", source: "Nguồn", id: "Mã",
  min: "Tối thiểu", max: "Tối đa", default: "Mặc định", segment: "Phân khúc", segments: "Phân khúc",
  household: "Hộ gia đình", shop: "Cửa hàng / văn phòng", factory: "Nhà xưởng", farm: "Trang trại",
  "bac-bo": "Bắc Bộ", "bac-trung-bo": "Bắc Trung Bộ", "nam-trung-bo": "Nam Trung Bộ", "tay-nguyen": "Tây Nguyên", "nam-bo": "Nam Bộ",
  tariffs: "Bảng giá điện", tiers: "Bậc giá", upTo: "Đến (kWh)", averageRate: "Giá bình quân (đ/kWh)",
  solarOffsetRate: "Giá phần điện mặt trời thay thế (đ/kWh)", tiered: "Bậc thang", flat: "Bình quân",
  vatRate: "Thuế VAT (0–0,3)", pricePerKwp: "Đơn giá trọn gói (đ/kWp)", peakSunHours: "Giờ nắng đỉnh theo vùng",
  segmentRatios: "Tỷ lệ dùng điện ban ngày (%)", system: "Thông số hệ thống", performanceRatio: "Hệ số hiệu suất (PR)",
  m2PerKwp: "Diện tích mái / kWp (m²)", panelWatt: "Công suất tấm pin (W)", kwpStep: "Bước công suất (kWp)",
  minKwp: "Công suất tối thiểu (kWp)", minRoofArea: "Diện tích mái tối thiểu (m²)", inputs: "Ô nhập theo phân khúc",
  bill: "Hóa đơn điện (đ/tháng)", roof: "Diện tích mái (m²)", defaultProvince: "Tỉnh/thành mặc định", tips: "Mẹo",
  resultTitle: "Tiêu đề kết quả", disclaimer: "Lưu ý miễn trừ", formTitle: "Tiêu đề form", formDescription: "Mô tả form",
  successText: "Thông báo gửi thành công", privacyNote: "Ghi chú bảo mật", leadSource: "Mã nguồn lead",
  quoteCta: "Nút nhận báo giá", decimals: "Số chữ số thập phân", suffix: "Hậu tố", prefix: "Tiền tố",
  products: "Sản phẩm", projects: "Dự án", shorts: "Video ngắn", posts: "Bài viết", testimonials: "Đánh giá khách hàng",
  certificates: "Chứng chỉ", brands: "Thương hiệu", press: "Báo chí", services: "Dịch vụ", badge: "Nhãn nổi bật", badges: "Nhãn", sub: "Dòng phụ", subHighlight: "Dòng phụ nhấn mạnh",
  score: "Điểm", milestones: "Cột mốc", tagline: "Khẩu hiệu", caption: "Chú thích", excerpt: "Trích đoạn", slug: "Đường dẫn rút gọn",
  slides: "Slide", lines: "Dòng", points: "Ý chính", highlights: "Điểm nổi bật", specs: "Thông số", warranty: "Bảo hành",
  location: "Địa điểm", period: "Thời gian", years: "Số năm", scope: "Phạm vi", models: "Mô hình", cases: "Trường hợp",
  channels: "Kênh", followers: "Người theo dõi", handle: "Tên tài khoản", provider: "Nguồn video", hours: "Giờ làm việc",
  branches: "Chi nhánh", stores: "Cửa hàng", office: "Văn phòng", warehouse: "Kho", legalName: "Tên pháp lý",
  menus: "Menu", topBar: "Thanh trên cùng", mobileLinks: "Liên kết trên di động", socials: "Mạng xã hội", legal: "Pháp lý",
  group: "Nhóm", groups: "Nhóm", columns: "Cột", rows: "Hàng", chart: "Biểu đồ", metrics: "Chỉ số", phases: "Giai đoạn",
  articles: "Bài viết", outlets: "Cơ quan báo chí", issuer: "Đơn vị cấp", verified: "Đã xác minh", tone: "Tông màu",
  sort: "Sắp xếp", field: "Trường", dir: "Chiều", asc: "Tăng dần", desc: "Giảm dần", focal: "Điểm lấy nét", x: "Ngang (x)", y: "Dọc (y)",
  primary: "Chính", secondary: "Phụ", form: "Form", fields: "Trường", message: "Lời nhắn", successTitle: "Tiêu đề khi gửi xong",
  successMessage: "Lời nhắn khi gửi xong", installment: "Trả góp", saving: "Tiết kiệm", production: "Sản lượng", packageSimulation: "Mô phỏng gói", short: "Tên ngắn", submitLabel: "Chữ nút gửi",
};

export function humanize(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/[-_]/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const WIDGET_KIND: Record<string, string> = {
  string: "Văn bản / URL", number: "Số", boolean: "Bật/tắt", enum: "Lựa chọn", object: "Nhóm", array: "Danh sách",
  record: "Bảng", union: "Nhiều dạng", json: "JSON", localized: "Văn bản", localizedTextarea: "Văn bản",
  media: "Ảnh", link: "Liên kết", richText: "Văn bản định dạng", collectionQuery: "Nguồn dữ liệu",
};

export function optionLabel(option: { value: string; node: FieldNode }, discriminated: boolean): string {
  if (discriminated) return humanize(option.value);
  return WIDGET_KIND[option.node.kind === "widget" ? option.node.widget : option.node.kind] ?? option.value;
}
