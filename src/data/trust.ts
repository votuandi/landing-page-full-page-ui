import type { Segment } from "@/config/segments";

/**
 * KHỐI UY TÍN trang chủ. [DỮ LIỆU MẪU] — mọi tên tổ chức, báo, khách hàng dưới đây là hư cấu
 * (ảnh có chữ "MẪU", tạo bằng scripts/make-trust-images.js). Thay bằng bản scan/logo/đánh giá thật trước khi xuất bản.
 */

/** Chứng chỉ/chứng nhận: `logo` hiện ở lưới, bấm vào mở `image` (ảnh lớn). */
export type Certificate = { id: string; name: string; issuer: string; logo: string; image: string };

export const CERTIFICATES: Certificate[] = [
  { id: "iso-9001", name: "ISO 9001:2015 – Quản lý chất lượng", issuer: "[CẦN XÁC MINH đơn vị cấp]", logo: "/images/trust/cert-iso-9001.svg", image: "/images/trust/cert-iso-9001-full.svg" },
  { id: "phan-phoi", name: "Nhà phân phối ủy quyền thiết bị", issuer: "[CẦN XÁC MINH hãng]", logo: "/images/trust/cert-phan-phoi.svg", image: "/images/trust/cert-phan-phoi-full.svg" },
  { id: "lap-dat", name: "Đối tác lắp đặt được chứng nhận", issuer: "[CẦN XÁC MINH hãng]", logo: "/images/trust/cert-lap-dat.svg", image: "/images/trust/cert-lap-dat-full.svg" },
  { id: "an-toan-dien", name: "Chứng chỉ an toàn điện cho kỹ thuật viên", issuer: "[CẦN XÁC MINH]", logo: "/images/trust/cert-an-toan-dien.svg", image: "/images/trust/cert-an-toan-dien-full.svg" },
  { id: "pccc", name: "Đủ điều kiện thi công PCCC", issuer: "[CẦN XÁC MINH]", logo: "/images/trust/cert-pccc.svg", image: "/images/trust/cert-pccc-full.svg" },
];

/** "Báo chí nói về chúng tôi" — mỗi logo mở bài viết ở tab mới. Mảng rỗng → ẩn cả khối báo chí. */
export type PressMention = { id: string; outlet: string; logo: string; title: string; url: string };

export const PRESS: PressMention[] = [
  { id: "nang-luong-xanh", outlet: "Năng Lượng Xanh (mẫu)", logo: "/images/trust/press-nang-luong-xanh.svg", title: "Mô hình trại gà chạy quạt bằng điện mặt trời", url: "https://example.com/bao-mau/trai-ga-dien-mat-troi" },
  { id: "kinh-te-moi", outlet: "Kinh Tế Mới (mẫu)", logo: "/images/trust/press-kinh-te-moi.svg", title: "Doanh nghiệp nhỏ cắt giảm chi phí điện nhờ mái nhà", url: "https://example.com/bao-mau/doanh-nghiep-nho" },
  { id: "doi-song-so", outlet: "Đời Sống Số (mẫu)", logo: "/images/trust/press-doi-song-so.svg", title: "Theo dõi điện nhà mình ngay trên điện thoại", url: "https://example.com/bao-mau/theo-doi-dien" },
  { id: "nha-nong", outlet: "Nhà Nông Ngày Nay (mẫu)", logo: "/images/trust/press-nha-nong.svg", title: "Điện mặt trời áp mái chuồng trại: lợi đôi đường", url: "https://example.com/bao-mau/mai-chuong-trai" },
];

/** Đánh giá khách hàng. */
export type Testimonial = { name: string; segment: Segment; location: string; kwp: number; quote: string; rating: number };

export const TESTIMONIALS: Testimonial[] = [
  { name: "Anh Minh Tuấn (mẫu)", segment: "household", location: "Thủ Đức, TP HCM", kwp: 6, rating: 5, quote: "Tiền điện từ 2,4 triệu còn khoảng 800 nghìn. Đội thợ lắp gọn trong một ngày, dọn sạch sẽ." },
  { name: "Chị Thu Hà (mẫu)", segment: "shop", location: "Ninh Kiều, Cần Thơ", kwp: 15, rating: 5, quote: "Tủ mát, máy lạnh chạy cả ngày mà hóa đơn giảm gần một nửa. Xem sản lượng trên app rất tiện." },
  { name: "Anh Văn Hùng (mẫu)", segment: "farm", location: "Tân Châu, Tây Ninh", kwp: 120, rating: 5, quote: "Trại gà 40.000 con, quạt hút chạy suốt. Có pin lưu trữ nên cúp điện vẫn yên tâm." },
  { name: "Chị Ngọc Lan (mẫu)", segment: "factory", location: "Biên Hòa, Đồng Nai", kwp: 250, rating: 4.8, quote: "Thi công theo khu vực, xưởng không phải dừng máy ngày nào. Hồ sơ đấu nối được lo trọn." },
];
