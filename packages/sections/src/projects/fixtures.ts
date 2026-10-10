import type { z } from "zod";
import type { projectsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const projectsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Công trình đã thực hiện",
    "en": "[SAMPLE DATA] Completed projects"
  },
  "title": {
    "vi": "Hơn 12.500 khách hàng đã dùng điện từ nắng.",
    "en": "12,500+ clients already run on sunshine."
  },
  "query": {
    "limit": 8
  },
  "showFilter": true,
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
  "savingLabel": {
    "vi": "Tiết kiệm/tháng",
    "en": "Monthly savings"
  },
  "allLabel": {
    "vi": "Tất cả",
    "en": "All"
  },
  "ctaLabel": {
    "vi": "Nhận báo giá công trình tương tự",
    "en": "Get a quote for a similar project"
  }
} satisfies z.input<typeof projectsSchema>;
