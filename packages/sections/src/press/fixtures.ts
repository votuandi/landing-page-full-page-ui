import type { z } from "zod";
import type { pressSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const pressFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Báo chí & truyền hình",
    "en": "[SAMPLE DATA] Báo chí & truyền hình"
  },
  "title": {
    "vi": "Truyền thông nói về chúng tôi.",
    "en": "What the media says."
  },
  "outlets": [
    {
      "id": "nmt",
      "name": {
        "vi": "Nhật báo Mặt Trời"
      },
      "short": "NMT"
    },
    {
      "id": "nlm",
      "name": {
        "vi": "Tạp chí Năng Lượng Mẫu"
      },
      "short": "NLM"
    },
    {
      "id": "ktx",
      "name": {
        "vi": "Kênh Kinh Tế Xanh TV"
      },
      "short": "KTX"
    },
    {
      "id": "cns",
      "name": {
        "vi": "Bản tin Công Nghiệp Số"
      },
      "short": "CNS"
    },
    {
      "id": "ptm",
      "name": {
        "vi": "Đài Truyền hình Mẫu"
      },
      "short": "PTM"
    },
    {
      "id": "dnv",
      "name": {
        "vi": "Doanh Nhân Việt Mẫu"
      },
      "short": "DNV"
    }
  ],
  "articles": [
    {
      "outletId": "nmt",
      "date": "2026-09-18",
      "title": {
        "vi": "Lumivolt khánh thành hệ BESS 500 kWh cho nhà máy dệt"
      },
      "excerpt": {
        "vi": "Hệ lưu trữ giúp nhà máy cắt đỉnh phụ tải giờ cao điểm, giảm khoảng 12% chi phí điện hằng tháng."
      },
      "url": "https://example.com/bai-viet-1"
    },
    {
      "outletId": "ktx",
      "date": "2026-08-02",
      "title": {
        "vi": "Phóng sự: Một ngày cùng đội kỹ sư lắp điện mặt trời áp mái"
      },
      "excerpt": {
        "vi": "Từ khảo sát kết cấu đến nghiệm thu chống dột — quy trình 5 bước được ghi lại trên công trường."
      },
      "url": "https://example.com/bai-viet-2"
    },
    {
      "outletId": "nlm",
      "date": "2026-06-21",
      "title": {
        "vi": "Nhà phân phối nội địa và bài toán chứng từ CO, CQ"
      },
      "excerpt": {
        "vi": "Minh bạch nguồn gốc thiết bị trở thành tiêu chí đầu tiên khi doanh nghiệp chọn tổng thầu EPC."
      },
      "url": "https://example.com/bai-viet-3"
    },
    {
      "outletId": "cns",
      "date": "2026-04-10",
      "title": {
        "vi": "Mô hình đại lý điện mặt trời cấp tỉnh: cơ hội và rủi ro"
      },
      "excerpt": {
        "vi": "Hơn 300 đại lý trong hệ thống được đào tạo kỹ thuật và hỗ trợ bảo hành trực tiếp."
      },
      "url": "https://example.com/bai-viet-4"
    },
    {
      "outletId": "ptm",
      "date": "2026-02-15",
      "title": {
        "vi": "Bơm nước năng lượng mặt trời giúp nông dân Tây Nguyên giảm chi phí"
      },
      "excerpt": {
        "vi": "Hệ bơm 7,5 HP thay thế máy dầu, hoàn vốn sau khoảng 3 mùa tưới."
      },
      "url": "https://example.com/bai-viet-5"
    }
  ]
} satisfies z.input<typeof pressSchema>;
