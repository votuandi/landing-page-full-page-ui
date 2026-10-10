import type { z } from "zod";
import type { aboutStorySchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const aboutStoryFixture = {
  "eyebrow": {
    "vi": "Câu chuyện",
    "en": "[SAMPLE DATA] Câu chuyện"
  },
  "title": {
    "vi": "Không bắt đầu bằng số tấm pin. Bắt đầu bằng hóa đơn điện của bạn.",
    "en": "Every project starts with your electricity bill."
  },
  "body": {
    "vi": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Mỗi công trình bắt đầu từ việc đọc hóa đơn, đo mái và hiểu giờ dùng điện. Nhờ vậy khách biết trước tiết kiệm bao nhiêu, bao lâu hoàn vốn — và ai chịu trách nhiệm sau khi bàn giao."
          }
        ]
      }
    ],
    "en": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "We survey your roof and energy use before designing a solar system."
          }
        ]
      }
    ]
  },
  "image": {
    "id": "/images/our_story.webp",
    "alt": {
      "vi": "Đội ngũ kỹ sư khảo sát công trình điện mặt trời"
    }
  },
  "stats": [
    {
      "sinceYear": 2012,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "năm kinh nghiệm",
        "en": "years of experience"
      }
    },
    {
      "value": 4200,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "công trình",
        "en": "projects"
      }
    },
    {
      "value": 186.4,
      "suffix": {
        "vi": " MWp"
      },
      "label": {
        "vi": "đã cung cấp & lắp đặt",
        "en": "supplied & installed"
      }
    },
    {
      "value": 85,
      "suffix": {
        "vi": "+"
      },
      "label": {
        "vi": "kỹ sư & kỹ thuật viên",
        "en": "engineers & technicians"
      }
    }
  ],
  "milestones": [
    {
      "year": "2012",
      "title": {
        "vi": "Thành lập"
      },
      "description": {
        "vi": "Bắt đầu từ đội kỹ thuật lắp đặt điện mặt trời cho hộ gia đình."
      }
    },
    {
      "year": "2015",
      "title": {
        "vi": "Cửa hàng & nhà xưởng"
      },
      "description": {
        "vi": "Chuẩn hóa quy trình khảo sát mái, mô phỏng sản lượng, thi công không gián đoạn kinh doanh."
      }
    },
    {
      "year": "2019",
      "title": {
        "vi": "Phân phối thiết bị"
      },
      "description": {
        "vi": "Nhà phân phối ủy quyền tấm pin, inverter, pin lưu trữ, BESS và đèn năng lượng mặt trời."
      }
    },
    {
      "year": "2026",
      "title": {
        "vi": "186,4 MWp"
      },
      "description": {
        "vi": "5 chi nhánh, 320+ đại lý, hơn 12.500 khách hàng."
      }
    }
  ],
  "values": [
    {
      "title": {
        "vi": "Minh bạch",
        "en": "Transparency"
      },
      "description": {
        "vi": "Số liệu minh bạch ở từng bước."
      }
    },
    {
      "title": {
        "vi": "Trách nhiệm",
        "en": "Accountability"
      },
      "description": {
        "vi": "Mỗi hạng mục có người chịu trách nhiệm và thời hạn bảo hành rõ ràng."
      }
    },
    {
      "title": {
        "vi": "Đồng hành lâu dài",
        "en": "Long-term care"
      },
      "description": {
        "vi": "Theo dõi sản lượng, bảo trì định kỳ sau khi bàn giao."
      }
    }
  ],
  "ctas": [
    {
      "kind": "calculator",
      "value": "",
      "label": {
        "vi": "Dự toán chi phí lắp đặt",
        "en": "Estimate installation costs"
      }
    },
    {
      "kind": "page",
      "value": "lien-he",
      "label": {
        "vi": "Đặt lịch khảo sát miễn phí",
        "en": "Book a free survey"
      }
    }
  ]
} satisfies z.input<typeof aboutStorySchema>;
