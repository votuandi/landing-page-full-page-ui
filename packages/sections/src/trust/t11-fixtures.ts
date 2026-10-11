import type { z } from "zod";
import type { trustSchema } from "./schema";
import { trustFixture } from "./fixtures";

/** [DỮ LIỆU MẪU] Homepage content from origin/template-11; production data must be verified. */
export const t11Fixture = { ...trustFixture,
  "eyebrow": {
    "vi": "Minh bạch từ đầu"
  },
  "title": {
    "vi": "Cần kiểm tra gì trước khi ký hợp đồng?"
  },
  "description": {
    "vi": "Cần đối chiếu pháp nhân, phạm vi công việc, thiết bị, bảo hành và yêu cầu pháp lý của công trình. Thông tin chưa xác nhận không nên được coi là cam kết."
  },
  "items": [
    {
      "id": "business",
      "title": {
        "vi": "[DỮ LIỆU MẪU] Đăng ký doanh nghiệp"
      },
      "subtitle": {
        "vi": "Chưa có hồ sơ để tra cứu"
      },
      "issuer": {
        "vi": ""
      },
      "number": {
        "vi": ""
      },
      "validUntil": {
        "vi": ""
      },
      "scope": {
        "vi": ""
      }
    },
    {
      "id": "safety",
      "title": {
        "vi": "[DỮ LIỆU MẪU] Hồ sơ năng lực và an toàn"
      },
      "subtitle": {
        "vi": "Chưa có hồ sơ để tra cứu"
      },
      "issuer": {
        "vi": ""
      },
      "number": {
        "vi": ""
      },
      "validUntil": {
        "vi": ""
      },
      "scope": {
        "vi": ""
      }
    }
  ],
  "legalItems": [
    {
      "id": "process",
      "question": {
        "vi": "Lắp điện mặt trời cần chuẩn bị hồ sơ gì?"
      },
      "answer": {
        "vi": "[CẦN XÁC MINH] Xác định loại công trình, quyền sử dụng mái và phương án đấu nối trước. Danh mục hồ sơ, thông báo/đăng ký và yêu cầu nghiệm thu phải được đơn vị chuyên môn xác nhận theo quy định có hiệu lực tại địa phương."
      },
      "source": "https://chinhphu.vn/he-thong-van-ban",
      "verified": false
    },
    {
      "id": "penalty",
      "question": {
        "vi": "Có những mức phạt nào cần lưu ý?"
      },
      "answer": {
        "vi": "[CẦN XÁC MINH] Chưa đưa mức phạt vào dữ liệu mẫu. Cần đối chiếu hành vi, chủ thể, thời điểm và văn bản có hiệu lực về điện lực, xây dựng, an toàn trước khi công bố con số cụ thể."
      },
      "source": "https://chinhphu.vn/he-thong-van-ban",
      "verified": false
    },
    {
      "id": "surplus",
      "question": {
        "vi": "Điện dư có được bán lại không?"
      },
      "answer": {
        "vi": "[CẦN XÁC MINH] Điều kiện mua bán, giới hạn và giá điện dư cần xác nhận với đơn vị điện lực và quy định đang áp dụng. Bộ tính này chỉ tính tiết kiệm từ điện tự dùng, không cộng doanh thu điện dư."
      },
      "source": "https://chinhphu.vn/he-thong-van-ban",
      "verified": false
    }
  ]
} satisfies z.input<typeof trustSchema>;
