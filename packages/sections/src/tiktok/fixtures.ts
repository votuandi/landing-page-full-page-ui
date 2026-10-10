import type { z } from "zod";
import type { tiktokSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const tiktokFixture = {
  "eyebrow": {
    "vi": "TikTok",
    "en": "[SAMPLE DATA] TikTok"
  },
  "title": {
    "vi": "Thi công thực tế mỗi ngày.",
    "en": "Real installs, every day."
  },
  "profile": {
    "handle": {
      "vi": "@lumivolt.demo"
    },
    "url": "https://www.tiktok.com/@lumivolt.demo"
  },
  "videos": [
    {
      "id": "tt1",
      "creator": {
        "vi": "@lumivolt.demo"
      },
      "title": {
        "vi": "Lắp 6 kWp nhà phố trong 1 ngày"
      },
      "segment": "household",
      "poster": {
        "id": "/images/shorts/ho-gia-dinh-1.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/ho-gia-dinh-1.mp4"
      }
    },
    {
      "id": "tt2",
      "creator": {
        "vi": "@kysu.nang"
      },
      "title": {
        "vi": "Kiểm tra string bằng camera nhiệt"
      },
      "segment": "factory",
      "poster": {
        "id": "/images/shorts/nha-xuong-1.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/nha-xuong-1.mp4"
      }
    },
    {
      "id": "tt3",
      "creator": {
        "vi": "@lumivolt.demo"
      },
      "title": {
        "vi": "Cửa hàng giảm 40% tiền điện"
      },
      "segment": "shop",
      "poster": {
        "id": "/images/shorts/cua-hang-1.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/cua-hang-1.mp4"
      }
    },
    {
      "id": "tt4",
      "creator": {
        "vi": "@daily.mientay"
      },
      "title": {
        "vi": "Trại gà chạy quạt hút bằng nắng"
      },
      "segment": "farm",
      "poster": {
        "id": "/images/shorts/trang-trai-1.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/trang-trai-1.mp4"
      }
    },
    {
      "id": "tt5",
      "creator": {
        "vi": "@lumivolt.demo"
      },
      "title": {
        "vi": "Hybrid có điện khi mất lưới"
      },
      "segment": "household",
      "poster": {
        "id": "/images/shorts/ho-gia-dinh-2.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/ho-gia-dinh-2.mp4"
      }
    },
    {
      "id": "tt6",
      "creator": {
        "vi": "@kysu.nang"
      },
      "title": {
        "vi": "Kho lạnh 500 kWp bàn giao"
      },
      "segment": "factory",
      "poster": {
        "id": "/images/shorts/nha-xuong-2.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/shorts/nha-xuong-2.mp4"
      }
    }
  ]
} satisfies z.input<typeof tiktokSchema>;
