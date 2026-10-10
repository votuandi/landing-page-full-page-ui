import type { z } from "zod";
import type { brandsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const brandsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Thương hiệu phân phối",
    "en": "[SAMPLE DATA] Distributed brands"
  },
  "title": {
    "vi": "Nhà phân phối ủy quyền — hàng chính hãng, bảo hành tại Việt Nam.",
    "en": "Authorised distributor — genuine stock, local warranty."
  },
  "description": {
    "vi": "Ký kết trực tiếp với hãng, đủ chứng từ CO/CQ cho từng lô. Tên thương hiệu trong demo là hư cấu.",
    "en": "Direct agreements with manufacturers, CO/CQ for every shipment. Demo brand names are fictional."
  },
  "groups": [
    {
      "id": "panel",
      "label": {
        "vi": "Tấm pin",
        "en": "Panel"
      }
    },
    {
      "id": "inverter",
      "label": {
        "vi": "Inverter",
        "en": "Inverter"
      }
    },
    {
      "id": "lithium",
      "label": {
        "vi": "Lithium",
        "en": "Lithium"
      }
    },
    {
      "id": "allinone",
      "label": {
        "vi": "All-in-one",
        "en": "All-in-one"
      }
    },
    {
      "id": "bess",
      "label": {
        "vi": "BESS",
        "en": "BESS"
      }
    }
  ],
  "items": [
    {
      "name": {
        "vi": "Helionyx"
      },
      "group": "panel"
    },
    {
      "name": {
        "vi": "Solvane"
      },
      "group": "panel"
    },
    {
      "name": {
        "vi": "Lumora"
      },
      "group": "panel"
    },
    {
      "name": {
        "vi": "Voltaris"
      },
      "group": "inverter"
    },
    {
      "name": {
        "vi": "Kinetra"
      },
      "group": "inverter"
    },
    {
      "name": {
        "vi": "Ohmora"
      },
      "group": "inverter"
    },
    {
      "name": {
        "vi": "Litheon"
      },
      "group": "lithium"
    },
    {
      "name": {
        "vi": "Cellora"
      },
      "group": "lithium"
    },
    {
      "name": {
        "vi": "Ferrovolt"
      },
      "group": "bess"
    }
  ],
  "signingVideo": {
    "title": {
      "vi": "Lễ ký kết hợp tác phân phối 2026",
      "en": "2026 distribution agreement signing"
    },
    "caption": {
      "vi": "Lumivolt × Helionyx × Voltaris (hư cấu)"
    },
    "poster": {
      "id": "/images/our_story.webp",
      "alt": {
        "vi": ""
      }
    },
    "source": {
      "provider": "file",
      "idOrSrc": "/videos/hero_video.mp4"
    }
  }
} satisfies z.input<typeof brandsSchema>;
