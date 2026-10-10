import type { z } from "zod";
import type { investmentModelsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const investmentModelsFixture = {
  "eyebrow": {
    "vi": "Hình thức đầu tư",
    "en": "[SAMPLE DATA] Hình thức đầu tư"
  },
  "title": {
    "vi": "Có tiền mặt hay không, đều lắp được điện mặt trời.",
    "en": "Solar investment options for every budget."
  },
  "description": {
    "vi": "* Lãi suất, kỳ hạn và điều kiện ESCO/thuê phụ thuộc đối tác tài chính và thẩm định dự án. [CẦN XÁC MINH]"
  },
  "models": [
    {
      "id": "buy",
      "title": {
        "vi": "Mua đứt",
        "en": "Buy outright"
      },
      "badge": {
        "vi": "Hiệu quả cao nhất"
      },
      "summary": {
        "vi": "Gia đình, cửa hàng, doanh nghiệp có sẵn ngân sách"
      },
      "points": [
        {
          "vi": "Sở hữu hệ thống ngay"
        },
        {
          "vi": "Toàn bộ tiền tiết kiệm thuộc về bạn"
        },
        {
          "vi": "Hoàn vốn nhanh nhất"
        }
      ]
    },
    {
      "id": "finance",
      "title": {
        "vi": "Trả góp",
        "en": "Installments"
      },
      "badge": {
        "vi": "Từ 0% lãi suất*"
      },
      "summary": {
        "vi": "Muốn lắp ngay, chia nhỏ chi phí"
      },
      "points": [
        {
          "vi": "Trả trước từ 20–30%"
        },
        {
          "vi": "Kỳ hạn 6–36 tháng qua đối tác"
        },
        {
          "vi": "Tiền tiết kiệm bù phần lớn tiền góp"
        }
      ]
    },
    {
      "id": "rent",
      "title": {
        "vi": "Thuê hệ thống",
        "en": "Rent"
      },
      "badge": {
        "vi": "Không lo bảo trì"
      },
      "summary": {
        "vi": "Cửa hàng, chuỗi, nhà xưởng vừa"
      },
      "points": [
        {
          "vi": "Phí thuê cố định hằng tháng"
        },
        {
          "vi": "Bảo trì, vệ sinh trọn gói"
        },
        {
          "vi": "Có quyền mua lại hệ thống"
        }
      ]
    },
    {
      "id": "esco",
      "title": {
        "vi": "Lắp đặt 0 đồng (ESCO)",
        "en": "ESCO"
      },
      "badge": {
        "vi": "Cho doanh nghiệp tiền điện lớn"
      },
      "summary": {
        "vi": "Nhà máy, trang trại tiền điện từ ~300 triệu/tháng"
      },
      "highlight": true,
      "points": [
        {
          "vi": "Nhà đầu tư bỏ 100% vốn"
        },
        {
          "vi": "Mua điện mặt trời giá thấp hơn EVN"
        },
        {
          "vi": "Nhận chuyển giao hệ thống cuối hợp đồng"
        }
      ]
    }
  ],
  "cta": {
    "kind": "calculator",
    "value": "",
    "label": {
      "vi": "Dự toán chi phí",
      "en": "Estimate costs"
    }
  }
} satisfies z.input<typeof investmentModelsSchema>;
