import type { z } from "zod";
import type { energyMonitoringSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const energyMonitoringFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Theo dõi điện năng 24/7",
    "en": "[SAMPLE DATA] Energy monitoring 24/7"
  },
  "title": {
    "vi": "Toàn bộ dòng điện của bạn, gọn trong lòng bàn tay.",
    "en": "Your entire energy flow in the palm of your hand."
  },
  "description": {
    "vi": "Mỗi hệ thống được bàn giao kèm ứng dụng giám sát. Xem điện năng sinh ra, tiêu thụ và lưu trữ theo thời gian thực.",
    "en": "Every system includes monitoring of production, consumption and storage in real time."
  },
  "flows": [
    {
      "label": {
        "vi": "Sản xuất",
        "en": "Production"
      },
      "value": 186,
      "unit": {
        "vi": "kW"
      }
    },
    {
      "label": {
        "vi": "Tiêu thụ",
        "en": "Consumption"
      },
      "value": 172,
      "unit": {
        "vi": "kW"
      }
    },
    {
      "label": {
        "vi": "Lưu trữ",
        "en": "Storage"
      },
      "value": 86,
      "unit": {
        "vi": "%"
      }
    }
  ],
  "features": [
    {
      "title": {
        "vi": "Cảnh báo tức thì khi sản lượng bất thường",
        "en": "Instant alerts on unusual production"
      },
      "description": {
        "vi": "Theo dõi trên ứng dụng.",
        "en": "Available in the monitoring app."
      }
    },
    {
      "title": {
        "vi": "Báo cáo tiết kiệm theo ngày, tháng, năm",
        "en": "Daily, monthly and yearly savings reports"
      },
      "description": {
        "vi": "Theo dõi trên ứng dụng.",
        "en": "Available in the monitoring app."
      }
    },
    {
      "title": {
        "vi": "Chia sẻ quyền xem cho nhiều thành viên",
        "en": "Share access with your team"
      },
      "description": {
        "vi": "Theo dõi trên ứng dụng.",
        "en": "Available in the monitoring app."
      }
    },
    {
      "title": {
        "vi": "Ứng dụng iOS, Android và trình duyệt web",
        "en": "iOS, Android and web app"
      },
      "description": {
        "vi": "Theo dõi trên ứng dụng.",
        "en": "Available in the monitoring app."
      }
    }
  ],
  "chart": {
    "production": [
      0,
      0,
      0,
      0,
      0,
      4,
      18,
      52,
      96,
      138,
      170,
      186,
      182,
      168,
      140,
      104,
      62,
      24,
      4,
      0,
      0,
      0,
      0,
      0
    ],
    "consumption": [
      38,
      34,
      32,
      30,
      32,
      44,
      88,
      140,
      162,
      170,
      174,
      172,
      150,
      168,
      176,
      170,
      158,
      120,
      84,
      70,
      62,
      54,
      46,
      40
    ],
    "productionLabel": {
      "vi": "Sản xuất",
      "en": "Production"
    },
    "consumptionLabel": {
      "vi": "Tiêu thụ",
      "en": "Consumption"
    }
  }
} satisfies z.input<typeof energyMonitoringSchema>;
