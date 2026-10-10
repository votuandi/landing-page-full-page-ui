import type { z } from "zod";
import type { testimonialsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const testimonialsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Khách hàng nói gì",
    "en": "[SAMPLE DATA] What clients say"
  },
  "title": {
    "vi": "Niềm tin đến từ những hóa đơn điện thật.",
    "en": "Trust built on real electricity bills."
  },
  "query": {},
  "ratings": [
    {
      "label": {
        "vi": "Google [DỮ LIỆU MẪU]",
        "en": "Google [SAMPLE DATA]"
      },
      "score": 4.9,
      "count": 1280,
      "url": "https://www.google.com/maps"
    }
  ],
  "segmentLabels": {
    "household": {
      "vi": "Hộ gia đình",
      "en": "Households"
    },
    "shop": {
      "vi": "Cửa hàng",
      "en": "Shops"
    },
    "factory": {
      "vi": "Nhà xưởng",
      "en": "Factories"
    },
    "farm": {
      "vi": "Trang trại",
      "en": "Farms"
    }
  }
} satisfies z.input<typeof testimonialsSchema>;
