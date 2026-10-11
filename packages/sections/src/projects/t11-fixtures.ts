import type { z } from "zod";
import type { projectsSchema } from "./schema";
import { projectsFixture } from "./fixtures";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
/** [DỮ LIỆU MẪU] Homepage content from origin/template-11; production data must be verified. */
export const t11Fixture = { ...projectsFixture,
  "eyebrow": {
    "vi": "Từ bài toán đến phương án"
  },
  "title": {
    "vi": "Dự án tương tự có thể tiết kiệm bao nhiêu?"
  },
  "query": {
        "limit": 8
  },
  "items": [
    {
      "id": "factory",
      "title": "[DỮ LIỆU MẪU] Mái xưởng chế biến",
      "segment": "factory",
      "location": "Đồng Nai",
      "kwp": 50,
      "image": {
        "id": "/images/illustrations/factory-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Mái xưởng chế biến"
        }
      }
    },
    {
      "id": "farm",
      "title": "[DỮ LIỆU MẪU] Trang trại có lưu trữ",
      "segment": "factory",
      "location": "Tây Ninh",
      "kwp": 100,
      "image": {
        "id": "/images/illustrations/farm-hybrid-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Trang trại có lưu trữ"
        }
      }
    },
    {
      "id": "shop",
      "title": "[DỮ LIỆU MẪU] Cửa hàng hoạt động cả ngày",
      "segment": "shop",
      "location": "TP. Hồ Chí Minh",
      "kwp": 10,
      "image": {
        "id": "/images/illustrations/shop-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Cửa hàng hoạt động cả ngày"
        }
      }
    },
    {
      "id": "home",
      "title": "[DỮ LIỆU MẪU] Ngôi nhà dùng điện buổi tối",
      "segment": "household",
      "location": "Đồng Tháp",
      "kwp": 5,
      "image": {
        "id": "/images/illustrations/home-solar.webp",
        "alt": {
          "vi": "[DỮ LIỆU MẪU] Ngôi nhà dùng điện buổi tối"
        }
      }
    }
  ],
  "evidence": { simulation: packageSimulationFixture,
    "carbonKgPerKwh": 0.6,
    "cases": [
      {
        "projectId": "factory",
        "packageId": "factory-hoa-luoi",
        "provinceId": "dong-nai",
        "description": {
          "vi": "[DỮ LIỆU MẪU] Doanh nghiệp chế biến — tình huống minh họa. Ưu tiên điện cho dây chuyền hoạt động ban ngày; kiểm tra kết cấu mái trước khi thiết kế."
        }
      },
      {
        "projectId": "farm",
        "packageId": "farm-hybrid",
        "provinceId": "tay-ninh",
        "description": {
          "vi": "[DỮ LIỆU MẪU] Trang trại — tình huống minh họa. Phân tách tải thiết yếu; dung lượng pin và thời gian dự phòng cần khảo sát riêng."
        }
      },
      {
        "projectId": "shop",
        "packageId": "retail-hoa-luoi",
        "provinceId": "ho-chi-minh",
        "description": {
          "vi": "[DỮ LIỆU MẪU] Cửa hàng bán lẻ — tình huống minh họa. Kết hợp điện cho điều hòa, chiếu sáng và thiết bị trong khung giờ mở cửa."
        }
      },
      {
        "projectId": "home",
        "packageId": "comfort-hybrid",
        "provinceId": "dong-thap",
        "description": {
          "vi": "[DỮ LIỆU MẪU] Hộ gia đình — tình huống minh họa. Dịch chuyển một phần điện mặt trời sang buổi tối bằng lưu trữ phù hợp phụ tải."
        }
      }
    ]
  }
} satisfies z.input<typeof projectsSchema>;
