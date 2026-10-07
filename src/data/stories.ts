import type { Segment } from "@/config/segments";

/**
 * VIDEO SHORTS CÔNG TRÌNH (section "Video công trình thực tế").
 *
 * source.provider:
 *  - "youtube": idOrSrc = ID video (vd. "dQw4w9WgXcQ"), phát qua youtube-nocookie.com
 *  - "tiktok" : idOrSrc = ID số của video TikTok, phát qua player chính thức tiktok.com/player/v1
 *  - "file"   : idOrSrc = đường dẫn .mp4 trong /public
 *  - "bunny"  : idOrSrc = URL .mp4 từ Bunny Stream / CDN
 * source.originalUrl (tùy chọn): link bài gốc → nút phụ "Xem trên TikTok/YouTube" (mở tab mới).
 *
 * Bản demo: 8 video "file" tự dựng bằng scripts/make-demo-shorts.sh từ ảnh minh họa của chính template
 * (không dùng nội dung bên thứ ba) — xem README "Nguồn video demo". Thay bằng video thật khi bàn giao.
 */
export type StoryProvider = "youtube" | "tiktok" | "file" | "bunny";
export type StoryType = "progress" | "done" | "customer";

export type Story = {
  id: string;
  shortTitle: string;
  location: string;
  kwp: number;
  segment: Segment;
  type: StoryType;
  poster: string;
  source: { provider: StoryProvider; idOrSrc: string; originalUrl?: string };
};

export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  progress: "Đang thi công",
  done: "Hoàn thành",
  customer: "Khách hàng chia sẻ",
};

/** Tổng số video trên kênh — hiển thị ở thẻ "Xem thêm". */
export const TOTAL_CHANNEL_VIDEOS = 150;

const file = (name: string, originalUrl?: string) => ({ provider: "file" as const, idOrSrc: `/videos/shorts/${name}.mp4`, originalUrl });
const poster = (name: string) => `/images/shorts/${name}.webp`;

// Demo: video đăng song song trên kênh → originalUrl trỏ về trang kênh (thay bằng link video thật).
const TIKTOK = "https://www.tiktok.com/@lumivolt.demo";
const YOUTUBE = "https://www.youtube.com/@lumivolt.demo/shorts";

export const STORIES: Story[] = [
  { id: "nha-pho-binh-thanh", shortTitle: "Nhà phố 6 kWp lắp xong trong 1 ngày", location: "TP Hồ Chí Minh", kwp: 6, segment: "household", type: "done", poster: poster("ho-gia-dinh-1"), source: file("ho-gia-dinh-1", TIKTOK) },
  { id: "tiem-tap-hoa-can-tho", shortTitle: "Siêu thị mini giảm 40% tiền điện mỗi tháng", location: "Cần Thơ", kwp: 15, segment: "shop", type: "customer", poster: poster("cua-hang-1"), source: file("cua-hang-1", YOUTUBE) },
  { id: "xuong-co-khi-dong-nai", shortTitle: "Thi công mái xưởng cơ khí không dừng máy", location: "Đồng Nai", kwp: 250, segment: "factory", type: "progress", poster: poster("nha-xuong-1"), source: file("nha-xuong-1", TIKTOK) },
  { id: "trai-ga-tay-ninh", shortTitle: "Trại gà 120 kWp chạy quạt hút bằng nắng", location: "Tây Ninh", kwp: 120, segment: "farm", type: "done", poster: poster("trang-trai-1"), source: file("trang-trai-1", TIKTOK) },
  { id: "biet-thu-da-lat", shortTitle: "Biệt thự hybrid vẫn có điện khi cúp điện", location: "Lâm Đồng", kwp: 10, segment: "household", type: "customer", poster: poster("ho-gia-dinh-2"), source: file("ho-gia-dinh-2", YOUTUBE) },
  { id: "chuoi-cafe-da-nang", shortTitle: "Chuỗi cà phê lắp đồng loạt 3 chi nhánh", location: "Đà Nẵng", kwp: 30, segment: "shop", type: "progress", poster: poster("cua-hang-2"), source: file("cua-hang-2") },
  { id: "kho-lanh-long-an", shortTitle: "Kho lạnh 500 kWp bàn giao sau 6 tuần", location: "Tây Ninh", kwp: 500, segment: "factory", type: "done", poster: poster("nha-xuong-2"), source: file("nha-xuong-2", YOUTUBE) },
  { id: "trai-heo-dong-thap", shortTitle: "Chủ trại heo kể chuyện tiền điện giảm một nửa", location: "Đồng Tháp", kwp: 80, segment: "farm", type: "customer", poster: poster("trang-trai-2"), source: file("trang-trai-2", TIKTOK) },
];

export const storyById = (id: string) => STORIES.find((s) => s.id === id);
