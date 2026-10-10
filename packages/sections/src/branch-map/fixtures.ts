import type { z } from "zod";
import type { branchMapSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const branchMapFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Hệ thống chi nhánh",
    "en": "[SAMPLE DATA] Hệ thống chi nhánh"
  },
  "title": {
    "vi": "5 chi nhánh — kho hàng sẵn, kỹ sư gần bạn.",
    "en": "5 branches — local stock, engineers nearby."
  },
  "description": {
    "vi": "Bấm vào ghim trên bản đồ để xem địa chỉ văn phòng, kho và hotline."
  },
  "query": {
    "limit": 12
  },
  "items": [
    {
      "id": "hcm",
      "name": "TP. Hồ Chí Minh",
      "primary": true,
      "hotline": "0901 234 500",
      "zaloPhone": "0901 234 500",
      "hours": "Mo-Sa 08:00-17:30",
      "office": {
        "address": "Tầng 9, Tòa nhà Mẫu 268, đường Số 1, P. Mẫu, TP. Hồ Chí Minh [HƯ CẤU]",
        "lat": 10.7865,
        "lng": 106.699
      },
      "warehouse": {
        "address": "Kho K3, KCN Mẫu Tây Bắc, TP. Hồ Chí Minh [HƯ CẤU]",
        "lat": 10.871,
        "lng": 106.605
      }
    },
    {
      "id": "hn",
      "name": "Hà Nội",
      "hotline": "0901 234 520",
      "zaloPhone": "0901 234 520",
      "hours": "Mo-Sa 08:00-17:30",
      "office": {
        "address": "Tầng 6, Tòa nhà Mẫu 88, phố Mẫu, Hà Nội [HƯ CẤU]",
        "lat": 21.03,
        "lng": 105.8
      },
      "warehouse": {
        "address": "Kho B2, Cụm công nghiệp Mẫu, Hà Nội [HƯ CẤU]",
        "lat": 21.09,
        "lng": 105.91
      }
    },
    {
      "id": "dn",
      "name": "Đà Nẵng",
      "hotline": "0901 234 540",
      "zaloPhone": "0901 234 540",
      "hours": "Mo-Sa 08:00-17:30",
      "office": {
        "address": "56 Đường Mẫu D, Đà Nẵng [HƯ CẤU]",
        "lat": 16.06,
        "lng": 108.21
      },
      "warehouse": {
        "address": "Kho C1, KCN Mẫu Hòa Khánh, Đà Nẵng [HƯ CẤU]",
        "lat": 16.075,
        "lng": 108.14
      }
    },
    {
      "id": "dl",
      "name": "Đắk Lắk",
      "hotline": "0901 234 560",
      "zaloPhone": "0901 234 560",
      "hours": "Mo-Sa 07:30-17:00",
      "office": {
        "address": "210 Đường Mẫu F, Buôn Ma Thuột, Đắk Lắk [HƯ CẤU]",
        "lat": 12.68,
        "lng": 108.04
      }
    },
    {
      "id": "ct",
      "name": "Cần Thơ",
      "hotline": "0901 234 580",
      "zaloPhone": "0901 234 580",
      "hours": "Mo-Sa 08:00-17:30",
      "office": {
        "address": "77 Đường Mẫu H, Cần Thơ [HƯ CẤU]",
        "lat": 10.03,
        "lng": 105.77
      },
      "warehouse": {
        "address": "Kho Mẫu Trà Nóc, Cần Thơ [HƯ CẤU]",
        "lat": 10.095,
        "lng": 105.72
      }
    }
  ],
  "officeLabel": {
    "vi": "Văn phòng",
    "en": "Office"
  },
  "warehouseLabel": {
    "vi": "Kho hàng",
    "en": "Warehouse"
  },
  "hotlineLabel": {
    "vi": "Hotline",
    "en": "Hotline"
  },
  "directionsLabel": {
    "vi": "Chỉ đường",
    "en": "Directions"
  },
  "zaloLabel": {
    "vi": "Zalo",
    "en": "Zalo"
  }
} satisfies z.input<typeof branchMapSchema>;
