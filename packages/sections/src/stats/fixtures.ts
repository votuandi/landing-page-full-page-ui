import type { z } from "zod";
import type { statsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const statsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Số liệu nổi bật",
    "en": "[SAMPLE DATA] Key figures"
  },
  "title": {
    "vi": "Năng lực triển khai",
    "en": "Our capabilities"
  },
  "items": [
    {
      "sinceYear": 2012,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "Năm kinh nghiệm",
        "en": "Years of experience"
      }
    },
    {
      "value": 186.4,
      "decimals": 1,
      "suffix": {
        "vi": " MWp"
      },
      "label": {
        "vi": "Đã cung cấp & lắp đặt",
        "en": "Supplied & installed"
      }
    },
    {
      "value": 4200,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "Công trình",
        "en": "Projects"
      }
    },
    {
      "value": 85,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "Kỹ sư & kỹ thuật viên",
        "en": "Engineers & technicians"
      }
    }
  ]
} satisfies z.input<typeof statsSchema>;
