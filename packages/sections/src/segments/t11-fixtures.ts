import type { z } from "zod";
import type { segmentsSchema } from "./schema";
import { segmentsFixture } from "./fixtures";

/** [DỮ LIỆU MẪU] Homepage content from origin/template-11; production data must be verified. */
export const t11Fixture = { ...segmentsFixture,
  "eyebrow": {
    "vi": "Theo cách dùng điện"
  },
  "title": {
    "vi": "Hòa lưới hay hybrid phù hợp với bạn?"
  },
  "description": {
    "vi": "Hòa lưới tận dụng điện ban ngày, hybrid bổ sung lưu trữ. Lựa chọn cần đối chiếu giờ dùng điện, nhu cầu dự phòng và vốn đầu tư."
  },
  "solarProfile": [
    0,
    0,
    0,
    0,
    0,
    0,
    5,
    20,
    45,
    65,
    85,
    95,
    100,
    95,
    80,
    60,
    35,
    10,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "items": [
    {
      "segment": "factory",
      "label": {
        "vi": "Nhà xưởng / trang trại"
      },
      "pitch": {
        "vi": "Hòa lưới phù hợp để đối chiếu trước khi phụ tải tập trung ban ngày; hybrid cần cân nhắc nếu có tải thiết yếu ngoài giờ nắng."
      },
      "saving": "",
      "image": {
        "id": "/images/illustrations/factory-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Nhà xưởng / trang trại"
        }
      },
      "comparison": { "title": {"vi":"Nhà xưởng nên chọn hệ nào?"},
        "consumption": [
          20,
          20,
          20,
          20,
          20,
          25,
          40,
          65,
          85,
          95,
          100,
          100,
          80,
          95,
          100,
          95,
          85,
          65,
          40,
          30,
          25,
          20,
          20,
          20
        ],
        "advantages": {
          "hoa-luoi": {
            "vi": "Vốn đầu tư thấp hơn, tận dụng tải ban ngày."
          },
          "hybrid": {
            "vi": "Có thể cấp tải thiết yếu khi thiết kế mạch dự phòng phù hợp."
          }
        },
        "limitations": {
          "hoa-luoi": {
            "vi": "Không tự duy trì cấp điện khi mất lưới."
          },
          "hybrid": {
            "vi": "Cần tính công suất xả, dung lượng pin và chi phí thay thế."
          }
        },
        "recommendation": {
          "vi": "Lấy biểu đồ phụ tải thực tế làm cơ sở, đặc biệt với bơm và động cơ công suất lớn."
        }
      }
    },
    {
      "segment": "shop",
      "label": {
        "vi": "Cửa hàng / chuỗi"
      },
      "pitch": {
        "vi": "Hòa lưới là lựa chọn để so sánh cho cửa hàng mở ban ngày; hybrid đáng cân nhắc khi điện buổi tối và yêu cầu liên tục cao."
      },
      "saving": "",
      "image": {
        "id": "/images/illustrations/shop-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Cửa hàng / chuỗi"
        }
      },
      "comparison": { "title": {"vi":"Cửa hàng có cần pin lưu trữ?"},
        "consumption": [
          10,
          10,
          10,
          10,
          10,
          10,
          20,
          40,
          65,
          80,
          85,
          90,
          90,
          90,
          95,
          95,
          95,
          100,
          100,
          90,
          70,
          40,
          20,
          10
        ],
        "advantages": {
          "hoa-luoi": {
            "vi": "Giảm phần điện mua cho điều hòa và thiết bị giờ nắng."
          },
          "hybrid": {
            "vi": "Chuyển một phần sản lượng sang giờ mở cửa buổi tối."
          }
        },
        "limitations": {
          "hoa-luoi": {
            "vi": "Phần điện dư ban trưa không tự dùng được ban đêm."
          },
          "hybrid": {
            "vi": "Hiệu quả phụ thuộc lịch vận hành và chu kỳ sử dụng pin."
          }
        },
        "recommendation": {
          "vi": "Với chuỗi cửa hàng, tính riêng từng điểm thay vì nhân một cấu hình cho cả chuỗi."
        }
      }
    },
    {
      "segment": "household",
      "label": {
        "vi": "Hộ gia đình"
      },
      "pitch": {
        "vi": "Hybrid có thể giúp tăng điện tự dùng buổi tối; hòa lưới vẫn nên so sánh nếu nhà có người sử dụng điện ban ngày."
      },
      "saving": "",
      "image": {
        "id": "/images/illustrations/home-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Hộ gia đình"
        }
      },
      "comparison": { "title": {"vi":"Gia đình dùng điện ban đêm chọn gì?"},
        "consumption": [
          20,
          15,
          15,
          15,
          15,
          25,
          60,
          80,
          35,
          25,
          25,
          40,
          50,
          35,
          30,
          30,
          40,
          70,
          100,
          100,
          85,
          65,
          45,
          30
        ],
        "advantages": {
          "hoa-luoi": {
            "vi": "Cấu hình đơn giản, chi phí khởi đầu thấp hơn."
          },
          "hybrid": {
            "vi": "Lưu trữ cho buổi tối và tải dự phòng được chọn."
          }
        },
        "limitations": {
          "hoa-luoi": {
            "vi": "Tiết kiệm giảm khi vắng nhà toàn bộ giờ nắng."
          },
          "hybrid": {
            "vi": "Không đồng nghĩa cấp điện cho mọi thiết bị khi mất lưới."
          }
        },
        "recommendation": {
          "vi": "Liệt kê thiết bị thiết yếu và số giờ dự phòng mong muốn trước khi chọn pin."
        }
      }
    }
  ]
} satisfies z.input<typeof segmentsSchema>;
