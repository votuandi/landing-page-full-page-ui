import type { z } from "zod";
import type { calculatorSchema } from "./schema";
import { calculatorFixture } from "./fixtures";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
/** [DỮ LIỆU MẪU] Homepage content from origin/template-11; production data must be verified. */
export const t11Fixture = { ...calculatorFixture,
  "eyebrow": {
    "vi": "Tính trước khi chọn"
  },
  "title": {
    "lead": {
      "vi": "Hóa đơn của bạn phù hợp"
    },
    "highlight": {
      "vi": "công suất nào?"
    }
  },
  "description": {
    "vi": "Công suất phù hợp phụ thuộc nơi lắp đặt và thời điểm dùng điện. Hóa đơn giúp xác định quy mô để bắt đầu cuộc trao đổi kỹ thuật."
  },
  "formTitle": {
    "vi": "Tiếp tục từ phương án bạn vừa chọn."
  },
  "formDescription": {
    "vi": "Chia sẻ thông tin gói để đội kỹ thuật trao đổi về mái và phụ tải của bạn."
  },
  "ctaLabel": {
    "vi": "Nhận báo giá"
  },
  "disclaimer": {
    "vi": "[DỮ LIỆU MẪU] Hoàn vốn chưa gồm bảo trì, thay pin, suy giảm, lãi vay hoặc thay đổi giá điện."
  },
  packageSimulation: packageSimulationFixture,
} satisfies z.input<typeof calculatorSchema>;
