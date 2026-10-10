import type { z } from "zod";
import type { warrantySchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const warrantyFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Bảo hành",
    "en": "[SAMPLE DATA] Bảo hành"
  },
  "title": {
    "vi": "Bảo hành tách bạch theo hạng mục.",
    "en": "Clear warranty terms by category."
  },
  "description": {
    "vi": "Cam kết được ghi rõ trong hợp đồng."
  },
  "rows": [
    {
      "item": {
        "vi": "Tấm pin"
      },
      "period": {
        "vi": "12–15 năm sản phẩm"
      },
      "note": {
        "vi": "25–30 năm hiệu suất*"
      }
    },
    {
      "item": {
        "vi": "Inverter"
      },
      "period": {
        "vi": "5–10 năm"
      },
      "note": {
        "vi": "Theo chính sách hãng*"
      }
    },
    {
      "item": {
        "vi": "Pin lưu trữ / BESS"
      },
      "period": {
        "vi": "10 năm*"
      },
      "note": {
        "vi": "Theo điều kiện chu kỳ / dung lượng"
      }
    },
    {
      "item": {
        "vi": "Đèn năng lượng mặt trời"
      },
      "period": {
        "vi": "1–3 năm"
      },
      "note": {
        "vi": "Theo từng dòng sản phẩm*"
      }
    },
    {
      "item": {
        "vi": "Thi công & chống dột"
      },
      "period": {
        "vi": "5 năm"
      },
      "note": {
        "vi": "Ghi rõ phạm vi trong hợp đồng"
      }
    }
  ],
  "footnote": {
    "vi": "* Theo hợp đồng thực tế và chính sách hãng. [CẦN XÁC MINH]"
  }
} satisfies z.input<typeof warrantySchema>;
