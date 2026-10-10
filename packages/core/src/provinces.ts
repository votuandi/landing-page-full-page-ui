import type { Region } from "./solarCalculator";

export const REGION_LABELS: Record<Region, string> = {
  "bac-bo": "Bắc Bộ",
  "bac-trung-bo": "Bắc Trung Bộ",
  "nam-trung-bo": "Nam Trung Bộ",
  "tay-nguyen": "Tây Nguyên",
  "nam-bo": "Nam Bộ",
};

export const REGION_ORDER = Object.keys(REGION_LABELS) as Region[];

/** 34 tỉnh/thành sau sắp xếp đơn vị hành chính 2025 — dữ liệu địa lý, không phải tham số giá. */
export const PROVINCES: { name: string; region: Region }[] = [
  ...["Hà Nội", "Hải Phòng", "Quảng Ninh", "Cao Bằng", "Lạng Sơn", "Lai Châu", "Điện Biên", "Sơn La", "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Ninh Bình"].map((name) => ({ name, region: "bac-bo" as const })),
  ...["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Trị", "Huế"].map((name) => ({ name, region: "bac-trung-bo" as const })),
  ...["Đà Nẵng", "Quảng Ngãi", "Khánh Hòa"].map((name) => ({ name, region: "nam-trung-bo" as const })),
  ...["Gia Lai", "Đắk Lắk", "Lâm Đồng"].map((name) => ({ name, region: "tay-nguyen" as const })),
  ...["TP Hồ Chí Minh", "Đồng Nai", "Tây Ninh", "Cần Thơ", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang"].map((name) => ({ name, region: "nam-bo" as const })),
];
