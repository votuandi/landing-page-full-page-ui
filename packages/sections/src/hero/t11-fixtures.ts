import type { z } from "zod";
import type { heroSchema } from "./schema";
import { heroFixture } from "./fixtures";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
/** [DỮ LIỆU MẪU] Homepage content from origin/template-11; production data must be verified. */
export const t11Fixture = { ...heroFixture, rating: undefined, secondaryCta: undefined, outputCard: undefined, savingCard: undefined, co2Card: undefined,
  "badge": {
    "vi": "Đầu tư có căn cứ"
  },
  "title": {
    "lead": {
      "vi": "Đừng để mái nhà chỉ che nắng."
    },
    "highlight": {
      "vi": "Hãy để nắng tạo giá trị."
    },
    "sub": {
      "vi": ""
    },
    "subHighlight": {
      "vi": ""
    }
  },
  "description": {
    "vi": "Biến diện tích sẵn có thành nguồn điện cho công việc và cuộc sống. Bắt đầu từ hóa đơn của bạn, so sánh từng phương án, rồi quyết định bằng số liệu."
  },
  "primaryCta": {
    "kind": "calculator",
    "value": "",
    "label": {
      "vi": "So sánh gói cho hóa đơn này"
    }
  },
  "stats": [
    {
      "value": 34,
      "decimals": 0,
      "unit": {
        "vi": "tỉnh"
      },
      "label": {
        "vi": "Tỉnh để tra sản lượng"
      }
    },
    {
      "value": 12,
      "decimals": 0,
      "unit": {
        "vi": "gói"
      },
      "label": {
        "vi": "Gói mẫu để đối chiếu"
      }
    },
    {
      "value": 80,
      "decimals": 0,
      "suffix": "%",
      "unit": {
        "vi": "PR"
      },
      "label": {
        "vi": "Hệ số PR giả định"
      }
    }
  ],
  "chips": [],
  packageSimulation: packageSimulationFixture,
} satisfies z.input<typeof heroSchema>;
