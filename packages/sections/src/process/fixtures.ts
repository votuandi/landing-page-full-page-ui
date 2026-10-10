import type { z } from "zod";
import type { processSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const processFixture = {
  "eyebrow": {
    "vi": "Quy trình triển khai",
    "en": "[SAMPLE DATA] How we deliver"
  },
  "title": {
    "vi": "Mỗi bước đều có đầu ra rõ ràng để bạn kiểm soát.",
    "en": "Every step has a clear deliverable you can check."
  },
  "steps": [
    {
      "title": {
        "vi": "Khảo sát",
        "en": "Survey"
      },
      "description": {
        "vi": "Phụ tải, hóa đơn, mái, trạm điện và điều kiện thi công.",
        "en": "Loads, bills, roof, substation and site conditions."
      },
      "output": {
        "vi": "Biên bản khảo sát + dữ liệu đầu vào",
        "en": "Survey report + input data"
      }
    },
    {
      "title": {
        "vi": "Thiết kế",
        "en": "Design"
      },
      "description": {
        "vi": "Mô phỏng sản lượng, chọn thiết bị, layout và phương án đấu nối.",
        "en": "Yield simulation, equipment, layout and grid connection."
      },
      "output": {
        "vi": "Hồ sơ kỹ thuật + mô hình tài chính",
        "en": "Technical file + financial model"
      }
    },
    {
      "title": {
        "vi": "Thi công",
        "en": "Installation"
      },
      "description": {
        "vi": "Kế hoạch an toàn, chia khu vực, quản lý vật tư và chất lượng.",
        "en": "Safety plan, zoned works, materials and QA."
      },
      "output": {
        "vi": "Checklist thi công + nhật ký",
        "en": "Checklist + site log"
      }
    },
    {
      "title": {
        "vi": "Nghiệm thu",
        "en": "Commissioning"
      },
      "description": {
        "vi": "Đo kiểm, cấu hình giám sát, hướng dẫn vận hành.",
        "en": "Testing, monitoring setup, operator training."
      },
      "output": {
        "vi": "Biên bản nghiệm thu + hồ sơ bàn giao",
        "en": "Acceptance + handover file"
      }
    },
    {
      "title": {
        "vi": "Bảo trì",
        "en": "O&M"
      },
      "description": {
        "vi": "Theo dõi sản lượng, cảnh báo, vệ sinh và bảo trì.",
        "en": "Output tracking, alerts, cleaning and maintenance."
      },
      "output": {
        "vi": "Báo cáo hiệu suất định kỳ",
        "en": "Periodic performance report"
      }
    }
  ],
  "outputLabel": {
    "vi": "Đầu ra",
    "en": "Deliverable"
  }
} satisfies z.input<typeof processSchema>;
