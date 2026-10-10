import type { z } from "zod";
import type { blogSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const blogFixture = {
  "eyebrow": {
    "vi": "Kinh nghiệm lắp đặt",
    "en": "[SAMPLE DATA] Installation know-how"
  },
  "title": {
    "vi": "Đọc trước khi lắp: tình huống thực tế.",
    "en": "Read before you install: real cases."
  },
  "query": {},
  "readMinutesLabel": {
    "vi": "phút đọc",
    "en": "min read"
  },
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
  },
  "allLink": {
    "kind": "page",
    "value": "tin-tuc",
    "label": {
      "vi": "Tất cả bài viết",
      "en": "All articles"
    }
  }
} satisfies z.input<typeof blogSchema>;
