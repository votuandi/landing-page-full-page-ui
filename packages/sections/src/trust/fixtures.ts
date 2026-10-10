import type { z } from "zod";
import type { trustSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const trustFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Chứng chỉ & giấy phép",
    "en": "[SAMPLE DATA] Certificates & licences"
  },
  "title": {
    "vi": "Năng lực được chứng nhận, minh bạch từng giấy tờ.",
    "en": "Certified capability, every document on show."
  },
  "items": [
    {
      "id": "iso9001",
      "title": {
        "vi": "ISO 9001:2015"
      },
      "subtitle": {
        "vi": "Hệ thống quản lý chất lượng",
        "en": "Quality management"
      },
      "issuer": {
        "vi": "Tổ chức chứng nhận Mẫu QA (hư cấu)"
      },
      "number": {
        "vi": "QA-MẪU-9001"
      },
      "validUntil": {
        "vi": "12/2027"
      },
      "scope": {
        "vi": "Phân phối thiết bị điện mặt trời; tư vấn thiết kế, thi công lắp đặt hệ thống điện mặt trời."
      },
      "image": {
        "id": "/images/trust/cert-iso-9001-full.svg",
        "alt": {
          "vi": "ISO 9001:2015"
        }
      }
    },
    {
      "id": "iso14001",
      "title": {
        "vi": "ISO 14001:2015"
      },
      "subtitle": {
        "vi": "Quản lý môi trường",
        "en": "Environmental management"
      },
      "issuer": {
        "vi": "Tổ chức chứng nhận Mẫu QA (hư cấu)"
      },
      "number": {
        "vi": "QA-MẪU-14001"
      },
      "validUntil": {
        "vi": "12/2027"
      },
      "scope": {
        "vi": "Hoạt động kho bãi, thi công và thu hồi vật tư tại các chi nhánh."
      },
      "image": {
        "id": "/images/trust/cert-iso-14001-full.svg",
        "alt": {
          "vi": "ISO 14001:2015"
        }
      }
    },
    {
      "id": "iso45001",
      "title": {
        "vi": "ISO 45001:2018"
      },
      "subtitle": {
        "vi": "An toàn sức khỏe nghề nghiệp",
        "en": "Occupational health & safety"
      },
      "issuer": {
        "vi": "Tổ chức chứng nhận Mẫu QA (hư cấu)"
      },
      "number": {
        "vi": "QA-MẪU-45001"
      },
      "validUntil": {
        "vi": "06/2028"
      },
      "scope": {
        "vi": "Thi công trên mái, làm việc trên cao và đấu nối điện."
      },
      "image": {
        "id": "/images/trust/cert-iso-45001-full.svg",
        "alt": {
          "vi": "ISO 45001:2018"
        }
      }
    },
    {
      "id": "xd-hang-2",
      "title": {
        "vi": "Chứng chỉ năng lực XD hạng II",
        "en": "Construction capability – Class II"
      },
      "subtitle": {
        "vi": "Thi công công trình năng lượng",
        "en": "Energy construction works"
      },
      "issuer": {
        "vi": "Sở Xây dựng (mẫu)"
      },
      "number": {
        "vi": "MẪU-0001"
      },
      "validUntil": {
        "vi": "03/2030"
      },
      "scope": {
        "vi": "Thi công lắp đặt thiết bị công trình năng lượng; tư vấn giám sát."
      },
      "image": {
        "id": "/images/trust/cert-xd-hang-2-full.svg",
        "alt": {
          "vi": "Chứng chỉ năng lực XD hạng II",
          "en": "Construction capability – Class II"
        }
      }
    },
    {
      "id": "gp-dien-luc",
      "title": {
        "vi": "Giấy phép hoạt động điện lực",
        "en": "Electricity operation licence"
      },
      "subtitle": {
        "vi": "Tư vấn thiết kế",
        "en": "Design consulting"
      },
      "issuer": {
        "vi": "Cơ quan cấp phép (mẫu)"
      },
      "number": {
        "vi": "MẪU-0002"
      },
      "validUntil": {
        "vi": "09/2029"
      },
      "scope": {
        "vi": "Tư vấn thiết kế công trình đường dây và trạm biến áp đến 35 kV."
      },
      "image": {
        "id": "/images/trust/cert-gp-dien-luc-full.svg",
        "alt": {
          "vi": "Giấy phép hoạt động điện lực",
          "en": "Electricity operation licence"
        }
      }
    },
    {
      "id": "phan-phoi",
      "title": {
        "vi": "Nhà phân phối ủy quyền",
        "en": "Authorised distributor"
      },
      "subtitle": {
        "vi": "Helionyx · Voltaris · Litheon"
      },
      "issuer": {
        "vi": "Các hãng thiết bị (hư cấu)"
      },
      "number": {
        "vi": "AUTH-2026-VN"
      },
      "validUntil": {
        "vi": "12/2026"
      },
      "scope": {
        "vi": "Phân phối chính hãng tại Việt Nam, bảo hành trực tiếp qua Lumivolt."
      },
      "image": {
        "id": "/images/trust/cert-phan-phoi-full.svg",
        "alt": {
          "vi": "Nhà phân phối ủy quyền",
          "en": "Authorised distributor"
        }
      }
    },
    {
      "id": "lap-dat",
      "title": {
        "vi": "Đối tác lắp đặt được chứng nhận",
        "en": "Certified installer"
      },
      "subtitle": {
        "vi": "Inverter & pin lưu trữ",
        "en": "Inverters & storage"
      },
      "issuer": {
        "vi": "Các hãng thiết bị (hư cấu)"
      },
      "number": {
        "vi": "PV-MẪU-0315"
      },
      "validUntil": {
        "vi": "06/2027"
      },
      "scope": {
        "vi": "Lắp đặt, cấu hình và bảo hành inverter hybrid, pin lưu trữ."
      },
      "image": {
        "id": "/images/trust/cert-lap-dat-full.svg",
        "alt": {
          "vi": "Đối tác lắp đặt được chứng nhận",
          "en": "Certified installer"
        }
      }
    },
    {
      "id": "an-toan-dien",
      "title": {
        "vi": "Chứng chỉ an toàn điện",
        "en": "Electrical safety"
      },
      "subtitle": {
        "vi": "Cho kỹ thuật viên",
        "en": "For technicians"
      },
      "issuer": {
        "vi": "[CẦN XÁC MINH]"
      },
      "number": {
        "vi": "ATĐ-MẪU-2026"
      },
      "validUntil": {
        "vi": "12/2026"
      },
      "scope": {
        "vi": "Toàn bộ kỹ thuật viên thi công và bảo trì."
      },
      "image": {
        "id": "/images/trust/cert-an-toan-dien-full.svg",
        "alt": {
          "vi": "Chứng chỉ an toàn điện",
          "en": "Electrical safety"
        }
      }
    },
    {
      "id": "pccc",
      "title": {
        "vi": "Đủ điều kiện thi công PCCC",
        "en": "Fire-safety works"
      },
      "subtitle": {
        "vi": "Hệ PV và BESS",
        "en": "PV and BESS systems"
      },
      "issuer": {
        "vi": "[CẦN XÁC MINH]"
      },
      "number": {
        "vi": "PCCC-MẪU-07"
      },
      "validUntil": {
        "vi": "08/2028"
      },
      "scope": {
        "vi": "Thiết kế, thi công giải pháp PCCC cho hệ điện mặt trời và lưu trữ."
      },
      "image": {
        "id": "/images/trust/cert-pccc-full.svg",
        "alt": {
          "vi": "Đủ điều kiện thi công PCCC",
          "en": "Fire-safety works"
        }
      }
    }
  ],
  "issuerLabel": {
    "vi": "Cấp bởi",
    "en": "Issuer"
  },
  "numberLabel": {
    "vi": "Số chứng chỉ",
    "en": "Certificate number"
  },
  "validLabel": {
    "vi": "Hiệu lực",
    "en": "Valid until"
  },
  "scopeLabel": {
    "vi": "Phạm vi",
    "en": "Scope"
  }
} satisfies z.input<typeof trustSchema>;
