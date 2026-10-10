import type { z } from "zod";
import type { socialSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const socialFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Mạng xã hội",
    "en": "[SAMPLE DATA] Mạng xã hội"
  },
  "title": {
    "vi": "Cộng đồng cùng theo dõi hành trình xanh.",
    "en": "A community following our green journey."
  },
  "channels": [
    {
      "kind": "facebook",
      "label": {
        "vi": "Facebook"
      },
      "handle": {
        "vi": "Lumivolt Energy"
      },
      "url": "https://www.facebook.com/lumivolt.demo",
      "followers": "128 N"
    },
    {
      "kind": "youtube",
      "label": {
        "vi": "YouTube"
      },
      "handle": {
        "vi": "@lumivolt.demo"
      },
      "url": "https://www.youtube.com/@lumivolt.demo",
      "followers": "46,5 N"
    },
    {
      "kind": "tiktok",
      "label": {
        "vi": "TikTok"
      },
      "handle": {
        "vi": "@lumivolt.demo"
      },
      "url": "https://www.tiktok.com/@lumivolt.demo",
      "followers": "212 N"
    },
    {
      "kind": "zalo",
      "label": {
        "vi": "Zalo OA"
      },
      "handle": {
        "vi": "Lumivolt Energy"
      },
      "url": "https://zalo.me/0901234500",
      "followers": "18,3 N"
    }
  ]
} satisfies z.input<typeof socialSchema>;
