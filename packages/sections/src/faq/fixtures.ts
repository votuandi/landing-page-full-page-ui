import type { z } from "zod";
import type { faqSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const faqFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Câu hỏi thường gặp",
    "en": "[SAMPLE DATA] FAQ"
  },
  "title": {
    "vi": "Những điều nên rõ trước khi lắp đặt.",
    "en": "What to know before you install."
  },
  "items": [
    {
      "question": {
        "vi": "Tiền điện bao nhiêu thì nên lắp điện mặt trời?"
      },
      "answer": {
        "vi": "Hộ gia đình từ khoảng 1 triệu đồng/tháng, cửa hàng và trang trại từ vài triệu đồng/tháng là đã có lợi — vì điện mặt trời cắt phần tiêu thụ ở bậc giá cao nhất. Dùng công cụ dự toán ở trên để xem công suất, chi phí và thời gian hoàn vốn cho đúng hóa đơn của bạn."
      }
    },
    {
      "question": {
        "vi": "Có trả góp hoặc lắp 0 đồng không?"
      },
      "answer": {
        "vi": "Có trả góp qua đối tác tài chính và cho thuê hệ thống. Mô hình lắp đặt 0 đồng (ESCO) dành cho doanh nghiệp có tiền điện lớn, phụ thuộc thẩm định của nhà đầu tư."
      }
    },
    {
      "question": {
        "vi": "Điện mặt trời thường hoàn vốn bao lâu?"
      },
      "answer": {
        "vi": "Thời gian hoàn vốn phụ thuộc tỷ lệ tự dùng, biểu giá điện, suất đầu tư và bức xạ tại khu vực. Công cụ dự toán trên website dùng cùng bộ tham số cấu hình để ước tính nhất quán."
      }
    },
    {
      "question": {
        "vi": "Mái tôn, mái ngói có lắp được không? Có bị dột không?"
      },
      "answer": {
        "vi": "Lắp được cả mái tôn, mái ngói và mái bê tông. Kỹ sư khảo sát kết cấu, chọn kẹp/ke phù hợp từng loại mái và kiểm tra chống thấm khi nghiệm thu; phạm vi bảo hành chống dột ghi rõ trong hợp đồng."
      }
    },
    {
      "question": {
        "vi": "Lắp mất bao lâu, có phải ngừng kinh doanh không?"
      },
      "answer": {
        "vi": "Nhà ở và cửa hàng thường lắp trong 1–2 ngày, không cần đóng cửa. Nhà xưởng, trang trại thi công theo khu vực để không gián đoạn sản xuất, chăn nuôi."
      }
    },
    {
      "question": {
        "vi": "Hệ thống chịu bão như thế nào?"
      },
      "answer": {
        "vi": "Thiết kế khung và liên kết phải dựa trên hiện trạng công trình, vùng gió và yêu cầu kỹ thuật. Với dự án nhà xưởng nên có kiểm tra kết cấu khi cần."
      }
    },
    {
      "question": {
        "vi": "Mất điện lưới thì điện mặt trời có chạy không?"
      },
      "answer": {
        "vi": "Hệ hòa lưới thông thường sẽ tự ngắt để bảo đảm an toàn. Muốn vẫn có điện khi mất lưới (camera, tủ đông, quạt chuồng trại…) cần hệ hybrid có pin lưu trữ."
      }
    },
    {
      "question": {
        "vi": "Mùa mưa có tạo ra điện không?"
      },
      "answer": {
        "vi": "Có, nhưng sản lượng giảm theo bức xạ. Ước tính năm phải tính theo dữ liệu khí hậu vùng, không dựa vào ngày nắng đẹp nhất."
      }
    },
    {
      "question": {
        "vi": "Bao lâu cần vệ sinh tấm pin?"
      },
      "answer": {
        "vi": "Thường 3–6 tháng/lần, khu vực nhiều bụi (gần đường lớn, trang trại, nhà xưởng) có thể dày hơn. Dữ liệu sản lượng trên ứng dụng giúp biết lúc nào cần vệ sinh."
      }
    },
    {
      "question": {
        "vi": "Có cần làm thủ tục với điện lực không?"
      },
      "answer": {
        "vi": "Tùy công suất và mô hình (tự dùng hay có bán điện dư), hệ thống cần đăng ký/thỏa thuận đấu nối với điện lực địa phương. Chúng tôi chuẩn bị hồ sơ và hỗ trợ làm việc với EVN. [CẦN XÁC MINH theo quy định hiện hành]"
      }
    }
  ],
  "jsonLd": true,
  "moreLink": {
    "kind": "page",
    "value": "cam-nang",
    "label": {
      "vi": "Xem cẩm nang đầy đủ",
      "en": "Read the full guide"
    }
  }
} satisfies z.input<typeof faqSchema>;
