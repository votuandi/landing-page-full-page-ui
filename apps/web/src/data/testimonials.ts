import type { Segment } from "@solar/core";

/**
 * ĐÁNH GIÁ KHÁCH HÀNG (section "Khách hàng nói gì"). Điểm Google/Trustpilot nằm ở `reviews` trong site.config.ts.
 * [DỮ LIỆU MẪU] — tên, nội dung hư cấu, có chữ "(mẫu)". Thay bằng đánh giá thật trước khi xuất bản.
 */
export type Testimonial = { name: string; segment: Segment; location: string; kwp: number; quote: string; rating: number };

export const TESTIMONIALS: Testimonial[] = [
  { name: "Anh Minh Tuấn (mẫu)", segment: "household", location: "Thủ Đức, TP HCM", kwp: 6, rating: 5, quote: "Tiền điện từ 2,4 triệu còn khoảng 800 nghìn. Đội thợ lắp gọn trong một ngày, dọn sạch sẽ, mái không bị dột." },
  { name: "Chị Thu Hà (mẫu)", segment: "shop", location: "Ninh Kiều, Cần Thơ", kwp: 15, rating: 5, quote: "Tủ mát, máy lạnh chạy cả ngày mà hóa đơn giảm gần một nửa. Ba cửa hàng theo dõi chung trên một app rất tiện." },
  { name: "Anh Văn Hùng (mẫu)", segment: "farm", location: "Tân Châu, Tây Ninh", kwp: 120, rating: 5, quote: "Trại gà 40.000 con, quạt hút chạy suốt. Có pin lưu trữ nên cúp điện vẫn yên tâm." },
  { name: "Chị Ngọc Lan (mẫu)", segment: "factory", location: "Biên Hòa, Đồng Nai", kwp: 250, rating: 4.8, quote: "Kỹ sư giải thích ROI và phương án thi công theo ca rất rõ. Xưởng không phải dừng máy ngày nào, hồ sơ đấu nối được lo trọn." },
];
