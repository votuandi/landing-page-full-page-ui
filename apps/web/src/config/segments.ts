/**
 * PHÂN KHÚC KHÁCH HÀNG — dùng chung cho lưới phân khúc, video, gói giải pháp, dự toán, công trình, blog.
 * Đổi tên hiển thị hoặc tỷ lệ dùng điện ban ngày mặc định ở đây.
 */
import type { Segment } from "@solar/core";

export const SEGMENTS: Record<Segment, {
  /** Tên đầy đủ (lưới phân khúc, calculator) */
  label: string;
  /** Tên ngắn (chip lọc) */
  short: string;
  /** Mô tả 1 dòng dưới ô phân khúc */
  pitch: string;
  /** Tỷ lệ % điện dùng ban ngày gợi ý cho calculator */
  defaultDaytimeRatio: number;
  /** Nhãn tiếng Anh (switch VI/EN) */
  en: { label: string; short: string; pitch: string };
}> = {
  household: { label: "Hộ gia đình", short: "Hộ gia đình", pitch: "Cắt phần điện bậc thang đắt nhất", defaultDaytimeRatio: 40, en: { label: "Households", short: "Homes", pitch: "Cut the most expensive tariff tiers" } },
  shop: { label: "Cửa hàng & chuỗi", short: "Cửa hàng", pitch: "Điều hòa, tủ mát chạy bằng nắng", defaultDaytimeRatio: 70, en: { label: "Shops & chains", short: "Shops", pitch: "Run AC and fridges on sunshine" } },
  factory: { label: "Nhà xưởng", short: "Nhà xưởng", pitch: "Mái xưởng thành nhà máy điện riêng", defaultDaytimeRatio: 80, en: { label: "Factories", short: "Factories", pitch: "Turn your roof into a power plant" } },
  farm: { label: "Trang trại", short: "Trang trại", pitch: "Quạt hút, bơm, sưởi cho trại gà, heo", defaultDaytimeRatio: 70, en: { label: "Farms", short: "Farms", pitch: "Fans, pumps and heating for livestock" } },
};

export const defaultDaytimeRatio = (segment: Segment) => SEGMENTS[segment].defaultDaytimeRatio;
