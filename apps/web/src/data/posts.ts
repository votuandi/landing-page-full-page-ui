import type { Segment } from "@solar/core";

/**
 * BLOG THEO TÌNH HUỐNG SỬ DỤNG (/tin-tuc). Bài mới nhất đặt ĐẦU mảng; trang chủ hiện 3–6 bài đầu.
 * Không ghi năm cố định trong tiêu đề/nội dung để bài không bị "cũ" theo thời gian.
 * Số liệu trong bài là ví dụ minh họa — [CẦN XÁC MINH] theo biểu giá và đơn giá hiện hành.
 */
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  segment?: Segment;
  cover: string;
  readMinutes: number;
  /** Mỗi phần tử: đoạn văn; bắt đầu bằng "## " là tiêu đề mục. */
  body: string[];
};

export const POSTS: Post[] = [
  {
    slug: "tien-dien-2-trieu-nen-lap-bao-nhieu-kwp",
    title: "Tiền điện 2 triệu/tháng nên lắp bao nhiêu kWp?",
    excerpt: "Cách quy đổi hóa đơn ra kWh, tính phần điện dùng ban ngày và chọn công suất vừa đủ — không thừa, không thiếu.",
    segment: "household", cover: "/images/illustrations/home-solar.webp", readMinutes: 5,
    body: [
      "Hóa đơn 2 triệu đồng/tháng với giá điện sinh hoạt bậc thang tương đương khoảng 600 kWh. Phần đắt nhất nằm ở các bậc cao — đó là phần điện mặt trời nên cắt trước.",
      "## Bước 1: Tách phần điện dùng ban ngày",
      "Gia đình đi làm cả ngày thường chỉ dùng 30–40% điện vào ban ngày; nhà có người ở nhà, có máy lạnh chạy trưa thì 50–60%. Với 600 kWh và 40% ban ngày, nhu cầu ban ngày khoảng 240 kWh/tháng.",
      "## Bước 2: Đổi ra công suất",
      "Ở miền Nam, 1 kWp tạo ra khoảng 110 kWh/tháng (4,6 giờ nắng × 30 ngày × hiệu suất 0,8). 240 kWh cần khoảng 2,2 kWp — làm tròn 2,5 kWp, tương đương 5 tấm pin 580W.",
      "## Có nên lắp lớn hơn?",
      "Nếu định mua thêm máy lạnh, xe điện hoặc muốn dùng pin lưu trữ cho buổi tối, có thể chọn 3–5 kWp. Dùng công cụ dự toán trên trang chủ để thử các phương án với đúng hóa đơn và tỉnh của bạn.",
    ],
  },
  {
    slug: "dien-mat-troi-cho-trai-ga",
    title: "Điện mặt trời cho trại gà: chạy quạt hút, giảm nỗi lo cúp điện",
    excerpt: "Quạt hút, hệ làm mát, đèn chiếu sáng chạy suốt ngày — vì sao trại gà là nơi điện mặt trời hoàn vốn nhanh.",
    segment: "farm", cover: "/images/illustrations/farm-hybrid-solar.webp", readMinutes: 6,
    body: [
      "Trại gà công nghiệp dùng điện nhiều nhất vào giữa trưa — đúng lúc tấm pin phát mạnh nhất. Tỷ lệ tự dùng thường đạt 70% trở lên nên mỗi kWh điện mặt trời đều thay được điện lưới.",
      "## Mái chuồng là tài sản đang bỏ trống",
      "Mái chuồng dài, ít bị che bóng, phù hợp lắp pin. Cần chọn khung và kẹp chống ăn mòn vì môi trường chuồng trại có amoniac và độ ẩm cao.",
      "## Hybrid để giữ quạt chạy khi mất điện",
      "Mất điện vài chục phút trong ngày nắng nóng có thể gây thiệt hại lớn. Hệ hybrid có pin lưu trữ ưu tiên cấp điện cho quạt hút và hệ làm mát, giảm phụ thuộc máy phát.",
      "## Bao lâu hoàn vốn?",
      "Với giá điện sản xuất và tỷ lệ tự dùng cao, nhiều trại hoàn vốn trong khoảng 4–5 năm. Con số cụ thể phụ thuộc hóa đơn, diện tích mái và vùng nắng — hãy thử dự toán cho trại của bạn.",
    ],
  },
  {
    slug: "dien-mat-troi-cho-nha-may",
    title: "Điện mặt trời cho nhà máy: thi công không dừng sản xuất",
    excerpt: "Mái xưởng lớn, tải chạy ban ngày — những điều cần kiểm tra trước khi đầu tư hệ thống vài trăm kWp.",
    segment: "factory", cover: "/images/solar-panels-hero.jpg", readMinutes: 7,
    body: [
      "Nhà máy chạy ca ngày có biểu đồ tải trùng khớp với đường cong phát điện của tấm pin. Đó là lý do hệ áp mái nhà xưởng thường có tỷ lệ tự dùng 85–95%.",
      "## Kiểm tra trước khi đầu tư",
      "Khảo sát kết cấu mái và tuổi mái tôn, vị trí trạm biến áp, phụ tải theo giờ (dữ liệu công tơ điện tử) và quyền sử dụng mái nếu nhà xưởng đi thuê.",
      "## Thi công theo khu vực",
      "Chia mái thành các khu, thi công ngoài giờ cao điểm sản xuất và đấu nối vào thời điểm dừng máy định kỳ để không ảnh hưởng đơn hàng.",
      "## Hình thức đầu tư",
      "Ngoài mua đứt, doanh nghiệp có thể cân nhắc trả góp hoặc mô hình đầu tư 0 đồng (thuê mái, mua điện giá thấp hơn lưới) tùy dòng tiền. [CẦN XÁC MINH điều kiện pháp lý hiện hành]",
    ],
  },
  {
    slug: "dien-mat-troi-cho-chuoi-cua-hang",
    title: "Điện mặt trời cho chuỗi cửa hàng: lắp đồng loạt, quản lý một chỗ",
    excerpt: "Giá điện kinh doanh cao, giờ mở cửa trùng giờ nắng — cách triển khai cho nhiều điểm bán cùng lúc.",
    segment: "shop", cover: "/images/illustrations/shop-solar.webp", readMinutes: 5,
    body: [
      "Cửa hàng tiện lợi, quán cà phê, nhà thuốc mở cửa từ sáng đến tối và dùng điện chủ yếu cho máy lạnh, tủ mát, chiếu sáng. Giá điện kinh doanh thuộc nhóm cao nhất nên mỗi kWh tự dùng tiết kiệm nhiều hơn.",
      "## Chuẩn hóa một cấu hình",
      "Với chuỗi, nên chuẩn hóa 1–2 cấu hình (ví dụ 10 kWp và 15 kWp) theo diện tích mái điển hình để rút ngắn thời gian khảo sát, thi công và dễ bảo trì.",
      "## Quản lý tập trung",
      "Toàn bộ điểm bán được theo dõi trên một tài khoản ứng dụng: sản lượng, tiết kiệm, cảnh báo lỗi. Bộ phận vận hành biết ngay điểm nào cần vệ sinh hoặc kiểm tra.",
      "## Không gián đoạn bán hàng",
      "Thi công ngoài giờ cao điểm hoặc ban đêm phần đi dây, mỗi điểm thường hoàn tất trong 1–2 ngày.",
    ],
  },
  {
    slug: "chon-den-nang-luong-mat-troi",
    title: "Chọn đèn năng lượng mặt trời: đừng chỉ nhìn số watt",
    excerpt: "Dung lượng pin, kích thước tấm pin và chỉ số chống nước mới quyết định đèn sáng được bao lâu.",
    cover: "/images/catalog/light-flood-300.svg", readMinutes: 4,
    body: [
      "Con số 100W, 300W in trên đèn thường không phản ánh độ sáng thực tế. Hãy xem dung lượng pin (mAh hoặc Wh), công suất tấm pin đi kèm và loại chip LED.",
      "## Tấm pin phải đủ sạc đầy pin",
      "Tấm pin quá nhỏ so với pin thì ngày âm u đèn không đủ sáng cả đêm. Pin LFP bền hơn pin thường, chịu nhiệt tốt hơn khi lắp ngoài trời.",
      "## Chống nước và vị trí lắp",
      "Chọn đèn từ IP65 trở lên, đặt tấm pin nơi có nắng trực tiếp ít nhất 5–6 giờ mỗi ngày, tránh bóng cây và mái hiên.",
    ],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
