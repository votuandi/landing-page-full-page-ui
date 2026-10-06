import type { Assumptions, Brand, Copy, LegalItem, Package, Project, Province, Segment, Testimonial } from "./types";

export const brand: Brand = {
  name: "Minwy Solar", slogan: "Mái nhà tạo điện. Dòng tiền tạo tương lai.",
  url: "https://template-11.minwysoft.com", email: "divt.it97@gmail.com",
  address: "TP. Hồ Chí Minh — địa chỉ văn phòng [CẦN XÁC MINH]",
  hotlines: [
    { id: "home", label: "Hộ gia đình", phone: "0708699808" },
    { id: "business", label: "Doanh nghiệp / nhà xưởng", phone: "0708699808" },
  ],
  zalo: { home: "https://zalo.me/0708699808", business: "https://zalo.me/0708699808" },
  socials: [],
  licenses: [
    { id: "business", title: "Đăng ký doanh nghiệp" },
    { id: "safety", title: "Hồ sơ năng lực và an toàn" },
  ],
};

// Giá/gói mô phỏng cho website demo; không phải báo giá thương mại.
const tiers = [
  { id: "compact", name: "Mái nhỏ", minBill: 0, maxBill: 1500000, kwp: 3, gridPrice: 42000000, hybridPrice: 69000000, storage: 5, phases: 1, roof: 18 },
  { id: "comfort", name: "Tổ ấm", minBill: 1500000, maxBill: 3000000, kwp: 5, gridPrice: 65000000, hybridPrice: 98000000, storage: 7, phases: 1, roof: 30 },
  { id: "retail", name: "Cửa hàng", minBill: 3000000, maxBill: 6000000, kwp: 10, gridPrice: 125000000, hybridPrice: 185000000, storage: 15, phases: 3, roof: 60 },
  { id: "chain", name: "Chuỗi cửa hàng", minBill: 6000000, maxBill: 15000000, kwp: 20, gridPrice: 240000000, hybridPrice: 360000000, storage: 30, phases: 3, roof: 120 },
  { id: "factory", name: "Nhà xưởng", minBill: 15000000, maxBill: 50000000, kwp: 50, gridPrice: 575000000, hybridPrice: 850000000, storage: 60, phases: 3, roof: 300 },
  { id: "farm", name: "Trang trại", minBill: 50000000, maxBill: null, kwp: 100, gridPrice: 1100000000, hybridPrice: 1650000000, storage: 120, phases: 3, roof: 600 },
];
export const pricing: Package[] = tiers.flatMap(t => (["hoa-luoi", "hybrid"] as const).map(type => ({
  id: `${t.id}-${type}`, name: `${t.name} · ${type === "hybrid" ? "Hybrid" : "Hòa lưới"}`, type,
  minBill: t.minBill, maxBill: t.maxBill, kwp: t.kwp, storageKwh: type === "hybrid" ? t.storage : 0,
  price: type === "hybrid" ? t.hybridPrice : t.gridPrice, phases: t.phases, roofM2: t.roof,
  equipment: ["Tấm pin đơn tinh thể", type === "hybrid" ? "Inverter hybrid + pin lưu trữ LFP" : "Inverter hòa lưới", "Khung đỡ, tủ bảo vệ, giám sát sản lượng"],
  warranty: "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng.",
})));

const atlas = "https://globalsolaratlas.info/map";
// Số liệu mô phỏng vùng, chưa trích xuất từ Atlas/địa điểm thực. PR dưới đây là hệ số điều chỉnh riêng cho demo.
const provinceRows: [string, string, number][] = [
  ["ha-noi", "Hà Nội", 3.4], ["hue", "Huế", 4.0], ["hai-phong", "Hải Phòng", 3.5],
  ["da-nang", "Đà Nẵng", 4.3], ["ho-chi-minh", "TP. Hồ Chí Minh", 4.6], ["can-tho", "Cần Thơ", 4.5],
  ["cao-bang", "Cao Bằng", 3.3], ["tuyen-quang", "Tuyên Quang", 3.4], ["lao-cai", "Lào Cai", 3.5],
  ["dien-bien", "Điện Biên", 3.8], ["lai-chau", "Lai Châu", 3.6], ["son-la", "Sơn La", 3.8],
  ["lang-son", "Lạng Sơn", 3.4], ["thai-nguyen", "Thái Nguyên", 3.4], ["phu-tho", "Phú Thọ", 3.5],
  ["bac-ninh", "Bắc Ninh", 3.4], ["quang-ninh", "Quảng Ninh", 3.5], ["hung-yen", "Hưng Yên", 3.5],
  ["ninh-binh", "Ninh Bình", 3.6], ["thanh-hoa", "Thanh Hóa", 3.7], ["nghe-an", "Nghệ An", 3.8],
  ["ha-tinh", "Hà Tĩnh", 3.9], ["quang-tri", "Quảng Trị", 4.0], ["quang-ngai", "Quảng Ngãi", 4.4],
  ["gia-lai", "Gia Lai", 4.7], ["khanh-hoa", "Khánh Hòa", 4.9], ["lam-dong", "Lâm Đồng", 4.8],
  ["dak-lak", "Đắk Lắk", 4.7], ["dong-nai", "Đồng Nai", 4.6], ["tay-ninh", "Tây Ninh", 4.6],
  ["dong-thap", "Đồng Tháp", 4.5], ["vinh-long", "Vĩnh Long", 4.5], ["an-giang", "An Giang", 4.6],
  ["ca-mau", "Cà Mau", 4.4],
];
export const pvout: Province[] = provinceRows.map(([id, name, value]) => ({ id, name, pvout: value, source: atlas, verified: false }));
export const assumptions: Assumptions = {
  electricityPrice: 3000, pr: 0.8, selfUse: { "hoa-luoi": 0.7, hybrid: 0.9 },
  defaultBill: 2200000, defaultProvince: "ho-chi-minh", years: 20,
  installment: { minMonths: 6, maxMonths: 24, defaultMonths: 12, interestPerMonth: 0 },
  monthlyFactors: [0.9, 0.95, 1.08, 1.12, 1.1, 1.02, 0.98, 0.96, 0.94, 0.95, 0.98, 1.02],
  carbonKgPerKwh: 0.6, source: "Giả định mô phỏng nội bộ; không phải biểu giá điện, chỉ số phát thải hay đề nghị tín dụng.", verified: false,
};
const legalSource = "https://chinhphu.vn/he-thong-van-ban";
export const legal: LegalItem[] = [
  { id: "process", question: "Lắp điện mặt trời cần chuẩn bị hồ sơ gì?", answer: "[CẦN XÁC MINH] Xác định loại công trình, quyền sử dụng mái và phương án đấu nối trước. Danh mục hồ sơ, thông báo/đăng ký và yêu cầu nghiệm thu phải được đơn vị chuyên môn xác nhận theo quy định có hiệu lực tại địa phương.", source: legalSource, verified: false },
  { id: "penalty", question: "Có những mức phạt nào cần lưu ý?", answer: "[CẦN XÁC MINH] Chưa đưa mức phạt vào dữ liệu mẫu. Cần đối chiếu hành vi, chủ thể, thời điểm và văn bản có hiệu lực về điện lực, xây dựng, an toàn trước khi công bố con số cụ thể.", source: legalSource, verified: false },
  { id: "surplus", question: "Điện dư có được bán lại không?", answer: "[CẦN XÁC MINH] Điều kiện mua bán, giới hạn và giá điện dư cần xác nhận với đơn vị điện lực và quy định đang áp dụng. Bộ tính này chỉ tính tiết kiệm từ điện tự dùng, không cộng doanh thu điện dư.", source: legalSource, verified: false },
];
export const projects: Project[] = [
  { id: "factory", segment: "factory", title: "Mái xưởng chế biến", business: "Doanh nghiệp chế biến — tình huống minh họa", provinceId: "dong-nai", packageId: "factory-hoa-luoi", image: "/images/illustrations/factory-solar.webp", description: "Ưu tiên điện cho dây chuyền hoạt động ban ngày; kiểm tra kết cấu mái trước khi thiết kế.", verified: false },
  { id: "farm", segment: "factory", title: "Trang trại có lưu trữ", business: "Trang trại — tình huống minh họa", provinceId: "tay-ninh", packageId: "farm-hybrid", image: "/images/illustrations/farm-hybrid-solar.webp", description: "Phân tách tải thiết yếu; dung lượng pin và thời gian dự phòng cần khảo sát riêng.", verified: false },
  { id: "shop", segment: "retail", title: "Cửa hàng hoạt động cả ngày", business: "Cửa hàng bán lẻ — tình huống minh họa", provinceId: "ho-chi-minh", packageId: "retail-hoa-luoi", image: "/images/illustrations/shop-solar.webp", description: "Kết hợp điện cho điều hòa, chiếu sáng và thiết bị trong khung giờ mở cửa.", verified: false },
  { id: "home", segment: "home", title: "Ngôi nhà dùng điện buổi tối", business: "Hộ gia đình — tình huống minh họa", provinceId: "dong-thap", packageId: "comfort-hybrid", image: "/images/illustrations/home-solar.webp", description: "Dịch chuyển một phần điện mặt trời sang buổi tối bằng lưu trữ phù hợp phụ tải.", verified: false },
];
export const testimonials: Testimonial[] = [
  { id: "operations", name: "Người phụ trách vận hành", role: "Góc nhìn minh họa · nhà xưởng", quote: "Tôi cần thấy điện tạo ra khớp với giờ máy chạy, rồi mới quyết định quy mô đầu tư.", verified: false },
  { id: "family", name: "Chủ hộ gia đình", role: "Góc nhìn minh họa · hộ gia đình", quote: "Bảng so sánh giúp tôi hiểu mình trả thêm cho pin lưu trữ để phục vụ nhu cầu nào.", verified: false },
];
export const segments: Segment[] = [
  { id: "factory", label: "Nhà xưởng / trang trại", title: "Nhà xưởng nên chọn hệ nào?", answer: "Hòa lưới phù hợp để đối chiếu trước khi phụ tải tập trung ban ngày; hybrid cần cân nhắc nếu có tải thiết yếu ngoài giờ nắng.", consumption: [20,20,20,20,20,25,40,65,85,95,100,100,80,95,100,95,85,65,40,30,25,20,20,20], advantages: { "hoa-luoi": "Vốn đầu tư thấp hơn, tận dụng tải ban ngày.", hybrid: "Có thể cấp tải thiết yếu khi thiết kế mạch dự phòng phù hợp." }, limitations: { "hoa-luoi": "Không tự duy trì cấp điện khi mất lưới.", hybrid: "Cần tính công suất xả, dung lượng pin và chi phí thay thế." }, recommendation: "Lấy biểu đồ phụ tải thực tế làm cơ sở, đặc biệt với bơm và động cơ công suất lớn." },
  { id: "retail", label: "Cửa hàng / chuỗi", title: "Cửa hàng có cần pin lưu trữ?", answer: "Hòa lưới là lựa chọn để so sánh cho cửa hàng mở ban ngày; hybrid đáng cân nhắc khi điện buổi tối và yêu cầu liên tục cao.", consumption: [10,10,10,10,10,10,20,40,65,80,85,90,90,90,95,95,95,100,100,90,70,40,20,10], advantages: { "hoa-luoi": "Giảm phần điện mua cho điều hòa và thiết bị giờ nắng.", hybrid: "Chuyển một phần sản lượng sang giờ mở cửa buổi tối." }, limitations: { "hoa-luoi": "Phần điện dư ban trưa không tự dùng được ban đêm.", hybrid: "Hiệu quả phụ thuộc lịch vận hành và chu kỳ sử dụng pin." }, recommendation: "Với chuỗi cửa hàng, tính riêng từng điểm thay vì nhân một cấu hình cho cả chuỗi." },
  { id: "home", label: "Hộ gia đình", title: "Gia đình dùng điện ban đêm chọn gì?", answer: "Hybrid có thể giúp tăng điện tự dùng buổi tối; hòa lưới vẫn nên so sánh nếu nhà có người sử dụng điện ban ngày.", consumption: [20,15,15,15,15,25,60,80,35,25,25,40,50,35,30,30,40,70,100,100,85,65,45,30], advantages: { "hoa-luoi": "Cấu hình đơn giản, chi phí khởi đầu thấp hơn.", hybrid: "Lưu trữ cho buổi tối và tải dự phòng được chọn." }, limitations: { "hoa-luoi": "Tiết kiệm giảm khi vắng nhà toàn bộ giờ nắng.", hybrid: "Không đồng nghĩa cấp điện cho mọi thiết bị khi mất lưới." }, recommendation: "Liệt kê thiết bị thiết yếu và số giờ dự phòng mong muốn trước khi chọn pin." },
];
export const copy: Copy = {
  eyebrow: "Đầu tư có căn cứ", heroTitle: "Đừng để mái nhà chỉ che nắng.", heroDescription: "Biến diện tích sẵn có thành nguồn điện cho công việc và cuộc sống. Bắt đầu từ hóa đơn của bạn, so sánh từng phương án, rồi quyết định bằng số liệu.",
  demoNotice: "Website mẫu · giá, sản lượng và câu chuyện khách hàng là dữ liệu mô phỏng.",
  problems: [
    { title: "Hóa đơn tăng, ngân sách bị động", text: "Bắt đầu bằng mức tiêu thụ và giờ dùng điện để biết phần nào có thể thay bằng điện mặt trời." },
    { title: "Mái có nắng, điện chưa tạo giá trị", text: "Diện tích, hướng mái và bóng che quyết định quy mô khả thi; không phải mái nào cũng giống nhau." },
    { title: "Nhiều gói, khó so sánh", text: "Đặt giá, lưu trữ, thiết bị và tiết kiệm cạnh nhau để hiểu chi phí đổi lấy điều gì." },
  ],
  billRanges: [ { label: "Dưới 1,5 triệu", value: 1000000 }, { label: "1,5–3 triệu", value: 2200000 }, { label: "3–6 triệu", value: 4500000 }, { label: "6–15 triệu", value: 10000000 }, { label: "15–50 triệu", value: 30000000 }, { label: "Trên 50 triệu", value: 60000000 } ],
  faq: [
    { question: "Bộ tính có phải báo giá cuối cùng không?", answer: "Không. Đây là mô phỏng từ dữ liệu mẫu; giá thực tế cần khảo sát mái, phụ tải, đấu nối và lựa chọn thiết bị." },
    { question: "Hoàn vốn đã gồm chi phí bảo trì chưa?", answer: "Chưa. Hoàn vốn đơn giản bằng giá gói chia tiết kiệm điện hằng năm; chưa gồm bảo trì, thay pin, suy giảm, lãi vay hoặc thay đổi giá điện." },
    { question: "Hybrid có cấp điện khi mất điện lưới không?", answer: "Khả năng dự phòng phụ thuộc thiết kế, inverter, pin và mạch tải thiết yếu. Cần xác nhận cấu hình cụ thể trước khi đặt mua." },
    { question: "Nhận tư vấn thì cần thông tin gì?", answer: "Bạn có thể chuẩn bị hóa đơn, lịch dùng điện, diện tích và ảnh mái. Đội kỹ thuật sẽ trao đổi để xác định phương án khảo sát." },
  ],
};
