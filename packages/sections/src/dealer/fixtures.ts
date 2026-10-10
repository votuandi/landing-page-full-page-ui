import type { z } from "zod";
import type { dealerSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const dealerFixture = {
  "eyebrow": {
    "vi": "Trở thành đại lý",
    "en": "[SAMPLE DATA] Trở thành đại lý"
  },
  "title": {
    "vi": "Cùng phân phối điện mặt trời tại địa phương của bạn.",
    "en": "Distribute solar in your own region."
  },
  "description": {
    "vi": "Hàng chính hãng, đủ chứng từ, đào tạo kỹ thuật và bảo hành tại chi nhánh gần nhất."
  },
  "stats": [
    {
      "value": 320,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "Đại lý toàn quốc",
        "en": "Dealers nationwide"
      }
    },
    {
      "value": 34,
      "suffix": {
        "vi": ""
      },
      "label": {
        "vi": "Tỉnh/thành phủ sóng",
        "en": "Provinces covered"
      }
    },
    {
      "value": 18,
      "suffix": {
        "vi": "%"
      },
      "label": {
        "vi": "Chiết khấu tối đa",
        "en": "Max. discount"
      }
    }
  ],
  "policies": [
    {
      "title": {
        "vi": "Chiết khấu theo bậc doanh số"
      },
      "body": {
        "vi": "Từ 8% đến 18% theo doanh số quý; thưởng thêm khi đạt mục tiêu năm. [DỮ LIỆU MẪU]"
      }
    },
    {
      "title": {
        "vi": "Hàng chính hãng, đủ chứng từ"
      },
      "body": {
        "vi": "Mọi lô hàng có hóa đơn VAT, CO, CQ; hỗ trợ hồ sơ nghiệm thu cho công trình của đại lý."
      }
    },
    {
      "title": {
        "vi": "Đào tạo kỹ thuật miễn phí"
      },
      "body": {
        "vi": "Khóa thiết kế, lắp đặt, cấu hình inverter/pin lưu trữ định kỳ tại 5 chi nhánh."
      }
    },
    {
      "title": {
        "vi": "Bảo hành 1 đổi 1 tại chi nhánh"
      },
      "body": {
        "vi": "Đại lý gửi bảo hành trực tiếp tại kho gần nhất, không phải gửi về hãng."
      }
    },
    {
      "title": {
        "vi": "Hỗ trợ marketing"
      },
      "body": {
        "vi": "Biển hiệu, catalogue, nội dung mạng xã hội và lead khách hàng theo khu vực."
      }
    }
  ],
  "faqs": [
    {
      "question": {
        "vi": "Điều kiện trở thành đại lý là gì?"
      },
      "answer": {
        "vi": "Có pháp nhân hoặc hộ kinh doanh, có điểm bán hoặc đội thi công, cam kết doanh số tối thiểu theo quý (mẫu). Chi tiết trao đổi trực tiếp với phòng kinh doanh."
      }
    },
    {
      "question": {
        "vi": "Có cần ký quỹ không?"
      },
      "answer": {
        "vi": "Không bắt buộc. Đại lý có thể chọn thanh toán theo đơn hoặc hạn mức công nợ sau 2 quý hợp tác (mẫu)."
      }
    },
    {
      "question": {
        "vi": "Thời gian giao hàng bao lâu?"
      },
      "answer": {
        "vi": "1–3 ngày làm việc từ kho chi nhánh gần nhất; đơn số lượng lớn giao thẳng từ kho tổng."
      }
    },
    {
      "question": {
        "vi": "Đại lý có được hỗ trợ thi công dự án lớn?"
      },
      "answer": {
        "vi": "Có. Đội kỹ sư EPC hỗ trợ khảo sát, thiết kế và giám sát các dự án nhà xưởng do đại lý giới thiệu."
      }
    }
  ],
  "gallery": [
    {
      "title": {
        "vi": "Hội nghị đại lý 2026"
      },
      "image": {
        "id": "/images/solar-panels-hero.jpg",
        "alt": {
          "vi": "Hội nghị đại lý 2026"
        }
      }
    },
    {
      "title": {
        "vi": "Đào tạo kỹ thuật inverter hybrid"
      },
      "image": {
        "id": "/images/solar-inverter-hero.jpg",
        "alt": {
          "vi": "Đào tạo kỹ thuật inverter hybrid"
        }
      }
    },
    {
      "title": {
        "vi": "Tham quan nhà máy đối tác"
      },
      "image": {
        "id": "/images/illustrations/factory-solar.webp",
        "alt": {
          "vi": "Tham quan nhà máy đối tác"
        }
      }
    },
    {
      "title": {
        "vi": "Khai trương đại lý Tây Nguyên"
      },
      "image": {
        "id": "/images/illustrations/farm-hybrid-solar.webp",
        "alt": {
          "vi": "Khai trương đại lý Tây Nguyên"
        }
      }
    },
    {
      "title": {
        "vi": "Workshop BESS cho nhà xưởng"
      },
      "image": {
        "id": "/images/solar-battery-hero.jpg",
        "alt": {
          "vi": "Workshop BESS cho nhà xưởng"
        }
      }
    }
  ],
  "form": {
    "title": {
      "vi": "Đăng ký làm đại lý",
      "en": "Apply now"
    },
    "description": {
      "vi": "Để lại thông tin — phòng kinh doanh khu vực gửi chính sách chi tiết và bảng giá đại lý."
    },
    "businessTypes": [
      {
        "vi": "Cửa hàng điện / vật tư"
      },
      {
        "vi": "Đội thi công lắp đặt"
      },
      {
        "vi": "Công ty xây dựng / M&E"
      },
      {
        "vi": "Cá nhân giới thiệu khách"
      },
      {
        "vi": "Khác"
      }
    ],
    "submitLabel": {
      "vi": "Đăng ký làm đại lý",
      "en": "Apply to become a dealer"
    },
    "successTitle": {
      "vi": "Đã nhận đăng ký đại lý!",
      "en": "Dealer application received!"
    },
    "successMessage": {
      "vi": "Phòng kinh doanh khu vực sẽ liên hệ trong 1 ngày làm việc.",
      "en": "Our regional team will contact you within 1 business day."
    }
  },
  "policyTab": {
    "vi": "Chính sách",
    "en": "Policy"
  },
  "faqTab": {
    "vi": "Hỏi đáp",
    "en": "Q&A"
  }
} satisfies z.input<typeof dealerSchema>;
