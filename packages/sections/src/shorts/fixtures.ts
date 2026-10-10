import type { z } from "zod";
import type { shortsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const shortsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Video công trình",
    "en": "[SAMPLE DATA] Project videos"
  },
  "title": {
    "vi": "Thi công & bàn giao thực tế — xem trước khi quyết định.",
    "en": "Real installs & handovers — watch before you decide."
  },
  "query": {
    "limit": 8
  },
  "description": {
    "vi": "Video ngắn từ công trình minh họa.",
    "en": "Short videos from sample projects."
  },
  "kindLabels": {
    "progress": {
      "vi": "Đang thi công",
      "en": "In progress"
    },
    "done": {
      "vi": "Hoàn thành",
      "en": "Completed"
    },
    "customer": {
      "vi": "Khách hàng chia sẻ",
      "en": "Client stories"
    }
  },
  "ctaLabel": {
    "vi": "Nhận báo giá công trình tương tự",
    "en": "Get a quote for a similar project"
  }
} satisfies z.input<typeof shortsSchema>;
