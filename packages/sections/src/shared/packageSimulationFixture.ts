import type { PackageSimulation } from "./packageSimulation";

/** [DỮ LIỆU MẪU] Fixed-package assumptions from origin/template-11. */
export const packageSimulationFixture = {
  "defaultBill": 2200000,
  "defaultProvince": "ho-chi-minh",
  "packages": [
    {
      "id": "compact-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Mái nhỏ · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 0,
      "maxBill": 1500000,
      "kwp": 3,
      "storageKwh": 0,
      "price": 42000000,
      "phases": 1,
      "roofM2": 18,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "compact-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Mái nhỏ · Hybrid"
      },
      "type": "hybrid",
      "minBill": 0,
      "maxBill": 1500000,
      "kwp": 3,
      "storageKwh": 5,
      "price": 69000000,
      "phases": 1,
      "roofM2": 18,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "comfort-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Tổ ấm · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 1500000,
      "maxBill": 3000000,
      "kwp": 5,
      "storageKwh": 0,
      "price": 65000000,
      "phases": 1,
      "roofM2": 30,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "comfort-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Tổ ấm · Hybrid"
      },
      "type": "hybrid",
      "minBill": 1500000,
      "maxBill": 3000000,
      "kwp": 5,
      "storageKwh": 7,
      "price": 98000000,
      "phases": 1,
      "roofM2": 30,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "retail-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Cửa hàng · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 3000000,
      "maxBill": 6000000,
      "kwp": 10,
      "storageKwh": 0,
      "price": 125000000,
      "phases": 3,
      "roofM2": 60,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "retail-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Cửa hàng · Hybrid"
      },
      "type": "hybrid",
      "minBill": 3000000,
      "maxBill": 6000000,
      "kwp": 10,
      "storageKwh": 15,
      "price": 185000000,
      "phases": 3,
      "roofM2": 60,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "chain-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Chuỗi cửa hàng · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 6000000,
      "maxBill": 15000000,
      "kwp": 20,
      "storageKwh": 0,
      "price": 240000000,
      "phases": 3,
      "roofM2": 120,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "chain-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Chuỗi cửa hàng · Hybrid"
      },
      "type": "hybrid",
      "minBill": 6000000,
      "maxBill": 15000000,
      "kwp": 20,
      "storageKwh": 30,
      "price": 360000000,
      "phases": 3,
      "roofM2": 120,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "factory-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Nhà xưởng · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 15000000,
      "maxBill": 50000000,
      "kwp": 50,
      "storageKwh": 0,
      "price": 575000000,
      "phases": 3,
      "roofM2": 300,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "factory-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Nhà xưởng · Hybrid"
      },
      "type": "hybrid",
      "minBill": 15000000,
      "maxBill": 50000000,
      "kwp": 50,
      "storageKwh": 60,
      "price": 850000000,
      "phases": 3,
      "roofM2": 300,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "farm-hoa-luoi",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Trang trại · Hòa lưới"
      },
      "type": "hoa-luoi",
      "minBill": 50000000,
      "maxBill": null,
      "kwp": 100,
      "storageKwh": 0,
      "price": 1100000000,
      "phases": 3,
      "roofM2": 600,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hòa lưới"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    },
    {
      "id": "farm-hybrid",
      "name": {
        "vi": "[DỮ LIỆU MẪU] Trang trại · Hybrid"
      },
      "type": "hybrid",
      "minBill": 50000000,
      "maxBill": null,
      "kwp": 100,
      "storageKwh": 120,
      "price": 1650000000,
      "phases": 3,
      "roofM2": 600,
      "equipment": [
        {
          "vi": "Tấm pin đơn tinh thể"
        },
        {
          "vi": "Inverter hybrid + pin lưu trữ LFP"
        },
        {
          "vi": "Khung đỡ, tủ bảo vệ, giám sát sản lượng"
        }
      ],
      "warranty": {
        "vi": "Mẫu: tấm pin 12 năm, inverter 5 năm, thi công 2 năm; xác nhận theo thiết bị và hợp đồng."
      }
    }
  ],
  "provinces": [
    {
      "id": "ha-noi",
      "name": {
        "vi": "Hà Nội"
      },
      "pvout": 3.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "hue",
      "name": {
        "vi": "Huế"
      },
      "pvout": 4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "hai-phong",
      "name": {
        "vi": "Hải Phòng"
      },
      "pvout": 3.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "da-nang",
      "name": {
        "vi": "Đà Nẵng"
      },
      "pvout": 4.3,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "ho-chi-minh",
      "name": {
        "vi": "TP. Hồ Chí Minh"
      },
      "pvout": 4.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "can-tho",
      "name": {
        "vi": "Cần Thơ"
      },
      "pvout": 4.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "cao-bang",
      "name": {
        "vi": "Cao Bằng"
      },
      "pvout": 3.3,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "tuyen-quang",
      "name": {
        "vi": "Tuyên Quang"
      },
      "pvout": 3.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "lao-cai",
      "name": {
        "vi": "Lào Cai"
      },
      "pvout": 3.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "dien-bien",
      "name": {
        "vi": "Điện Biên"
      },
      "pvout": 3.8,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "lai-chau",
      "name": {
        "vi": "Lai Châu"
      },
      "pvout": 3.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "son-la",
      "name": {
        "vi": "Sơn La"
      },
      "pvout": 3.8,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "lang-son",
      "name": {
        "vi": "Lạng Sơn"
      },
      "pvout": 3.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "thai-nguyen",
      "name": {
        "vi": "Thái Nguyên"
      },
      "pvout": 3.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "phu-tho",
      "name": {
        "vi": "Phú Thọ"
      },
      "pvout": 3.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "bac-ninh",
      "name": {
        "vi": "Bắc Ninh"
      },
      "pvout": 3.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "quang-ninh",
      "name": {
        "vi": "Quảng Ninh"
      },
      "pvout": 3.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "hung-yen",
      "name": {
        "vi": "Hưng Yên"
      },
      "pvout": 3.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "ninh-binh",
      "name": {
        "vi": "Ninh Bình"
      },
      "pvout": 3.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "thanh-hoa",
      "name": {
        "vi": "Thanh Hóa"
      },
      "pvout": 3.7,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "nghe-an",
      "name": {
        "vi": "Nghệ An"
      },
      "pvout": 3.8,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "ha-tinh",
      "name": {
        "vi": "Hà Tĩnh"
      },
      "pvout": 3.9,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "quang-tri",
      "name": {
        "vi": "Quảng Trị"
      },
      "pvout": 4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "quang-ngai",
      "name": {
        "vi": "Quảng Ngãi"
      },
      "pvout": 4.4,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "gia-lai",
      "name": {
        "vi": "Gia Lai"
      },
      "pvout": 4.7,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "khanh-hoa",
      "name": {
        "vi": "Khánh Hòa"
      },
      "pvout": 4.9,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "lam-dong",
      "name": {
        "vi": "Lâm Đồng"
      },
      "pvout": 4.8,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "dak-lak",
      "name": {
        "vi": "Đắk Lắk"
      },
      "pvout": 4.7,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "dong-nai",
      "name": {
        "vi": "Đồng Nai"
      },
      "pvout": 4.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "tay-ninh",
      "name": {
        "vi": "Tây Ninh"
      },
      "pvout": 4.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "dong-thap",
      "name": {
        "vi": "Đồng Tháp"
      },
      "pvout": 4.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "vinh-long",
      "name": {
        "vi": "Vĩnh Long"
      },
      "pvout": 4.5,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "an-giang",
      "name": {
        "vi": "An Giang"
      },
      "pvout": 4.6,
      "source": "https://globalsolaratlas.info/map"
    },
    {
      "id": "ca-mau",
      "name": {
        "vi": "Cà Mau"
      },
      "pvout": 4.4,
      "source": "https://globalsolaratlas.info/map"
    }
  ],
  "assumptions": {
    "electricityPrice": 3000,
    "pr": 0.8,
    "selfUse": {
      "hoa-luoi": 0.7,
      "hybrid": 0.9
    },
    "years": 20,
    "monthlyFactors": [
      0.9,
      0.95,
      1.08,
      1.12,
      1.1,
      1.02,
      0.98,
      0.96,
      0.94,
      0.95,
      0.98,
      1.02
    ],
    "installment": {
      "minMonths": 6,
      "maxMonths": 24,
      "defaultMonths": 12,
      "interestPerMonth": 0
    },
    "source": {
      "vi": "[DỮ LIỆU MẪU] Giả định mô phỏng nội bộ; không phải biểu giá điện, chỉ số phát thải hay đề nghị tín dụng."
    }
  }
} satisfies PackageSimulation;
