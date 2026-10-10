import type { z } from "zod";
import type { ctaBannerSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const ctaBannerFixture = {
  "eyebrow": {
    "vi": "Đội ngũ kỹ sư",
    "en": "[SAMPLE DATA] Engineering team"
  },
  "title": {
    "vi": "85+ kỹ sư sẵn sàng thiết kế cho công trình của bạn.",
    "en": "85+ engineers ready to design your system."
  },
  "description": {
    "vi": "Tư vấn miễn phí, báo giá trong 24 giờ, khảo sát tận nơi tại 34 tỉnh/thành.",
    "en": "Free consultation, quote within 24 hours, on-site survey in 34 provinces."
  },
  "image": {
    "id": "/images/services/service_1772898001151.webp",
    "alt": {
      "vi": ""
    }
  },
  "primaryCta": {
    "kind": "zalo",
    "value": "0901234500",
    "label": {
      "vi": "Chat Zalo với kỹ sư",
      "en": "Chat with an engineer"
    }
  },
  "secondaryCta": {
    "kind": "phone",
    "value": "0901234500",
    "label": {
      "vi": "0901 234 500"
    }
  }
} satisfies z.input<typeof ctaBannerSchema>;
