import type { z } from "zod";
import type { servicesSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const servicesFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Giải pháp điện mặt trời",
    "en": "[SAMPLE DATA] Giải pháp điện mặt trời"
  },
  "title": {
    "vi": "Thiết kế theo cách bạn dùng điện.",
    "en": "Designed around your energy use."
  },
  "items": [
    {
      "id": "home",
      "title": {
        "vi": "Hộ gia đình",
        "en": "Households"
      },
      "image": {
        "id": "/images/illustrations/home-solar-tall.webp",
        "alt": {
          "vi": "Hộ gia đình"
        }
      },
      "points": [
        {
          "vi": "Hòa lưới hoặc hybrid có lưu trữ"
        },
        {
          "vi": "Theo dõi sản lượng trên điện thoại"
        },
        {
          "vi": "Trả góp 0% qua đối tác (mẫu)"
        }
      ],
      "segment": "household"
    },
    {
      "id": "business",
      "title": {
        "vi": "Doanh nghiệp",
        "en": "Businesses"
      },
      "image": {
        "id": "/images/illustrations/shop-solar-tall.webp",
        "alt": {
          "vi": "Doanh nghiệp"
        }
      },
      "points": [
        {
          "vi": "Giờ kinh doanh trùng giờ nắng"
        },
        {
          "vi": "Báo cáo tiết kiệm hằng tháng"
        },
        {
          "vi": "Thi công ngoài giờ, không gián đoạn"
        }
      ],
      "segment": "shop"
    },
    {
      "id": "factory",
      "title": {
        "vi": "Nhà xưởng",
        "en": "Factories"
      },
      "image": {
        "id": "/images/illustrations/factory-solar-tall.webp",
        "alt": {
          "vi": "Nhà xưởng"
        }
      },
      "points": [
        {
          "vi": "EPC trọn gói từ hồ sơ tới đấu nối"
        },
        {
          "vi": "BESS cắt đỉnh, dự phòng tải"
        },
        {
          "vi": "Mô hình ESCO 0 đồng (mẫu)"
        }
      ],
      "segment": "factory"
    },
    {
      "id": "farm",
      "title": {
        "vi": "Nông nghiệp",
        "en": "Agriculture"
      },
      "image": {
        "id": "/images/illustrations/farm-hybrid-solar.webp",
        "alt": {
          "vi": "Nông nghiệp"
        }
      },
      "points": [
        {
          "vi": "Bơm nước năng lượng mặt trời"
        },
        {
          "vi": "Khung chống ăn mòn chuồng trại"
        },
        {
          "vi": "Thay thế máy phát diesel"
        }
      ],
      "segment": "farm"
    }
  ],
  "videos": [
    {
      "title": {
        "vi": "Thi công 1,2 MWp nhà máy dệt"
      },
      "location": {
        "vi": "TP. HCM"
      },
      "poster": {
        "id": "/images/illustrations/factory-solar.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/hero_video.mp4"
      }
    },
    {
      "title": {
        "vi": "Lắp BESS 500 kWh ngoài trời"
      },
      "location": {
        "vi": "TP. HCM"
      },
      "poster": {
        "id": "/images/solar-battery-hero.jpg",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/hero_video.mp4"
      }
    },
    {
      "title": {
        "vi": "Nhà phố hybrid 10 kWp"
      },
      "location": {
        "vi": "Hà Nội"
      },
      "poster": {
        "id": "/images/illustrations/home-solar.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/hero_video.mp4"
      }
    },
    {
      "title": {
        "vi": "Bơm tưới cà phê 7,5 HP"
      },
      "location": {
        "vi": "Đắk Lắk"
      },
      "poster": {
        "id": "/images/illustrations/farm-hybrid-solar.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/hero_video.mp4"
      }
    },
    {
      "title": {
        "vi": "Kho lạnh 620 kWp bàn giao"
      },
      "location": {
        "vi": "Tây Ninh"
      },
      "poster": {
        "id": "/images/illustrations/cold-storage-solar.webp",
        "alt": {
          "vi": ""
        }
      },
      "source": {
        "provider": "file",
        "idOrSrc": "/videos/hero_video.mp4"
      }
    }
  ],
  "ctaLabel": {
    "vi": "Dự toán cho phân khúc này",
    "en": "Estimate for this segment"
  }
} satisfies z.input<typeof servicesSchema>;
