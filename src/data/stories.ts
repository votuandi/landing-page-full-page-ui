import type { Segment } from "@/config/solar";

/**
 * VIDEO SHORTS CÔNG TRÌNH.
 * provider:
 *  - "youtube": id_or_src = ID video Shorts (vd. "dQw4w9WgXcQ"), originalUrl = link gốc
 *  - "tiktok" : id_or_src = ID số của video TikTok, originalUrl = link gốc
 *  - "file"   : id_or_src = đường dẫn .mp4 trong /public
 *  - "bunny"  : id_or_src = URL .mp4/HLS từ Bunny Stream CDN
 * Bản demo dùng 8 video "file" tự dựng từ ảnh minh họa của chính template (xem README – Nguồn video).
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
  source: { provider: StoryProvider; id_or_src: string; originalUrl?: string };
};

export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  progress: "Đang thi công",
  done: "Hoàn thành",
  customer: "Khách hàng chia sẻ",
};

/** Tổng số video trên kênh, hiển thị ở thẻ "Xem thêm". */
export const TOTAL_CHANNEL_VIDEOS = 120;

const file = (name: string) => ({ provider: "file" as const, id_or_src: `/videos/stories/${name}.mp4` });

export const STORIES: Story[] = [
  { id: "s1", shortTitle: "Nhà phố 6 kWp lắp xong trong 1 ngày", location: "TP HCM", kwp: 6, segment: "household", type: "done", poster: "/images/stories/ho-gia-dinh-1.webp", source: file("ho-gia-dinh-1") },
  { id: "s2", shortTitle: "Siêu thị mini giảm 40% tiền điện", location: "Cần Thơ", kwp: 15, segment: "shop", type: "customer", poster: "/images/stories/cua-hang-1.webp", source: file("cua-hang-1") },
  { id: "s3", shortTitle: "Thi công mái nhà máy phân bón", location: "Đồng Nai", kwp: 998, segment: "factory", type: "progress", poster: "/images/stories/nha-xuong-1.webp", source: file("nha-xuong-1") },
  { id: "s4", shortTitle: "Biệt thự hybrid có điện khi mất lưới", location: "Lâm Đồng", kwp: 10, segment: "household", type: "customer", poster: "/images/stories/ho-gia-dinh-2.webp", source: file("ho-gia-dinh-2") },
  { id: "s5", shortTitle: "Nhà hàng chạy bếp lạnh bằng nắng", location: "Đà Nẵng", kwp: 25, segment: "shop", type: "done", poster: "/images/stories/cua-hang-2.webp", source: file("cua-hang-2") },
  { id: "s6", shortTitle: "Trại gà 320 kWp + pin lưu trữ", location: "Tây Ninh", kwp: 320, segment: "factory", type: "done", poster: "/images/stories/nha-xuong-2.webp", source: file("nha-xuong-2") },
  { id: "s7", shortTitle: "Lắp đồng loạt 12 hộ khu dân cư", location: "Bắc Ninh", kwp: 60, segment: "household", type: "progress", poster: "/images/stories/ho-gia-dinh-3.webp", source: file("ho-gia-dinh-3") },
  { id: "s8", shortTitle: "Showroom mái tôn 18 kWp", location: "Hà Nội", kwp: 18, segment: "shop", type: "progress", poster: "/images/stories/cua-hang-3.webp", source: file("cua-hang-3") },
];
