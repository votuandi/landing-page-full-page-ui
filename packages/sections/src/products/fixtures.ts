import type { z } from "zod";
import type { productsSchema } from "./schema";

/** [DỮ LIỆU MẪU] — nội dung minh họa từ template t15. */
export const productsFixture = {
  "eyebrow": {
    "vi": "[DỮ LIỆU MẪU] Cửa hàng thiết bị",
    "en": "[SAMPLE DATA] Cửa hàng thiết bị"
  },
  "title": {
    "vi": "Thiết bị & sản phẩm năng lượng mặt trời chính hãng.",
    "en": "Genuine solar equipment & products."
  },
  "description": {
    "vi": "Thêm vào giỏ yêu cầu báo giá — chúng tôi gọi lại báo giá và tư vấn lắp đặt."
  },
  "query": {
    "filter": {
      "featured": true
    },
    "limit": 8
  },
  "items": [
    {
      "id": "helionyx-nova-n-590w",
      "slug": "helionyx-nova-n-590w",
      "name": "Tấm pin Nova N-type 590W",
      "brand": "Helionyx",
      "category": "panel",
      "categoryLabel": "Tấm pin",
      "images": [
        {
          "id": "/images/catalog/panel-ntype.svg",
          "alt": {
            "vi": "Tấm pin Nova N-type 590W"
          }
        }
      ],
      "price": 3450000,
      "salePrice": 3150000,
      "unit": "tấm",
      "warranty": "12 năm sản phẩm • 30 năm hiệu suất",
      "specs": [
        {
          "label": "Công suất",
          "value": "590 W"
        },
        {
          "label": "Công nghệ",
          "value": "N-type TOPCon"
        },
        {
          "label": "Hiệu suất",
          "value": "22,8%"
        },
        {
          "label": "Kích thước",
          "value": "2278 × 1134 mm"
        },
        {
          "label": "Khối lượng",
          "value": "27,5 kg"
        }
      ],
      "featured": true,
      "href": "/san-pham/helionyx-nova-n-590w"
    },
    {
      "id": "voltaris-vg-5k",
      "slug": "voltaris-vg-5k",
      "name": "Inverter hòa lưới VG-5K 1 pha",
      "brand": "Voltaris",
      "category": "inverter",
      "categoryLabel": "Inverter",
      "images": [
        {
          "id": "/images/catalog/inverter-grid.svg",
          "alt": {
            "vi": "Inverter hòa lưới VG-5K 1 pha"
          }
        }
      ],
      "price": 16900000,
      "unit": "bộ",
      "warranty": "10 năm",
      "specs": [
        {
          "label": "Công suất AC",
          "value": "5 kW"
        },
        {
          "label": "Pha",
          "value": "1 pha"
        },
        {
          "label": "MPPT",
          "value": "2"
        },
        {
          "label": "Hiệu suất",
          "value": "98,4%"
        },
        {
          "label": "Giám sát",
          "value": "Wi-Fi + ứng dụng"
        }
      ],
      "featured": true,
      "href": "/san-pham/voltaris-vg-5k"
    },
    {
      "id": "voltaris-vh-10k",
      "slug": "voltaris-vh-10k",
      "name": "Inverter hybrid VH-10K 3 pha",
      "brand": "Voltaris",
      "category": "inverter",
      "categoryLabel": "Inverter",
      "images": [
        {
          "id": "/images/catalog/inverter-hybrid.svg",
          "alt": {
            "vi": "Inverter hybrid VH-10K 3 pha"
          }
        },
        {
          "id": "/images/catalog/battery-10.svg",
          "alt": {
            "vi": "Inverter hybrid VH-10K 3 pha"
          }
        }
      ],
      "price": 42500000,
      "salePrice": 39900000,
      "unit": "bộ",
      "warranty": "5 năm tiêu chuẩn",
      "specs": [
        {
          "label": "Công suất",
          "value": "10 kW"
        },
        {
          "label": "Kiểu",
          "value": "Hybrid 3 pha"
        },
        {
          "label": "Chuyển mạch dự phòng",
          "value": "< 10 ms"
        },
        {
          "label": "MPPT",
          "value": "2"
        },
        {
          "label": "Pin tương thích",
          "value": "LFP điện áp cao"
        }
      ],
      "featured": true,
      "href": "/san-pham/voltaris-vh-10k"
    },
    {
      "id": "cellora-wall-5",
      "slug": "cellora-wall-5",
      "name": "Pin lưu trữ PowerWall LFP 5 kWh",
      "brand": "Cellora",
      "category": "battery",
      "categoryLabel": "Pin lưu trữ",
      "images": [
        {
          "id": "/images/catalog/battery-5.svg",
          "alt": {
            "vi": "Pin lưu trữ PowerWall LFP 5 kWh"
          }
        }
      ],
      "price": 32000000,
      "salePrice": 29500000,
      "unit": "khối",
      "warranty": "10 năm",
      "specs": [
        {
          "label": "Dung lượng",
          "value": "5,12 kWh"
        },
        {
          "label": "Hóa học",
          "value": "LiFePO4"
        },
        {
          "label": "Điện áp",
          "value": "51,2 V"
        },
        {
          "label": "Chu kỳ",
          "value": "≥ 6.000"
        },
        {
          "label": "Lắp đặt",
          "value": "Treo tường / xếp chồng"
        }
      ],
      "featured": true,
      "href": "/san-pham/cellora-wall-5"
    },
    {
      "id": "den-pha-100w",
      "slug": "den-pha-100w",
      "name": "Đèn pha năng lượng mặt trời 100W",
      "brand": "Lumivolt Light",
      "category": "light",
      "categoryLabel": "Đèn năng lượng mặt trời",
      "images": [
        {
          "id": "/images/catalog/light-flood-100.svg",
          "alt": {
            "vi": "Đèn pha năng lượng mặt trời 100W"
          }
        }
      ],
      "price": 650000,
      "salePrice": 520000,
      "unit": "bộ",
      "warranty": "2 năm",
      "specs": [
        {
          "label": "Công suất",
          "value": "100 W"
        },
        {
          "label": "Tấm pin",
          "value": "6V 15W rời"
        },
        {
          "label": "Pin",
          "value": "LFP 10.000 mAh"
        },
        {
          "label": "Thời gian sáng",
          "value": "10–12 giờ"
        },
        {
          "label": "Chống nước",
          "value": "IP67"
        }
      ],
      "featured": true,
      "href": "/san-pham/den-pha-100w"
    },
    {
      "id": "den-pha-300w",
      "slug": "den-pha-300w",
      "name": "Đèn pha năng lượng mặt trời 300W",
      "brand": "Lumivolt Light",
      "category": "light",
      "categoryLabel": "Đèn năng lượng mặt trời",
      "images": [
        {
          "id": "/images/catalog/light-flood-300.svg",
          "alt": {
            "vi": "Đèn pha năng lượng mặt trời 300W"
          }
        }
      ],
      "price": 1250000,
      "salePrice": 1190000,
      "unit": "bộ",
      "warranty": "2 năm",
      "specs": [
        {
          "label": "Công suất",
          "value": "300 W"
        },
        {
          "label": "Tấm pin",
          "value": "6V 30W rời"
        },
        {
          "label": "Pin",
          "value": "LFP 25.000 mAh"
        },
        {
          "label": "Thời gian sáng",
          "value": "12 giờ"
        },
        {
          "label": "Phù hợp",
          "value": "Sân, kho, trang trại"
        }
      ],
      "featured": true,
      "href": "/san-pham/den-pha-300w"
    },
    {
      "id": "den-duong-200w",
      "slug": "den-duong-200w",
      "name": "Đèn đường liền thể 200W",
      "brand": "Lumivolt Light",
      "category": "light",
      "categoryLabel": "Đèn năng lượng mặt trời",
      "images": [
        {
          "id": "/images/catalog/light-street.svg",
          "alt": {
            "vi": "Đèn đường liền thể 200W"
          }
        }
      ],
      "price": 1850000,
      "unit": "bộ",
      "warranty": "3 năm",
      "specs": [
        {
          "label": "Công suất",
          "value": "200 W"
        },
        {
          "label": "Kiểu",
          "value": "Liền thể (pin + đèn)"
        },
        {
          "label": "Cảm biến",
          "value": "Chuyển động + ánh sáng"
        },
        {
          "label": "Chiều cao lắp",
          "value": "4–6 m"
        },
        {
          "label": "Chống nước",
          "value": "IP66"
        }
      ],
      "featured": true,
      "href": "/san-pham/den-duong-200w"
    },
    {
      "id": "connecta-mc4-kit",
      "slug": "connecta-mc4-kit",
      "name": "Bộ cáp DC 4 mm² + đầu nối MC4",
      "brand": "Connecta",
      "category": "accessory",
      "categoryLabel": "Phụ kiện",
      "images": [
        {
          "id": "/images/catalog/acc-mc4.svg",
          "alt": {
            "vi": "Bộ cáp DC 4 mm² + đầu nối MC4"
          }
        }
      ],
      "price": 390000,
      "unit": "bộ",
      "warranty": "Theo lô hàng",
      "specs": [
        {
          "label": "Tiết diện",
          "value": "4 mm²"
        },
        {
          "label": "Chiều dài",
          "value": "10 m"
        },
        {
          "label": "Đầu nối",
          "value": "MC4 IP68"
        },
        {
          "label": "Chịu UV",
          "value": "Có"
        },
        {
          "label": "Ứng dụng",
          "value": "Chuỗi DC"
        }
      ],
      "featured": true,
      "href": "/san-pham/connecta-mc4-kit"
    }
  ],
  "allLink": {
    "kind": "page",
    "value": "san-pham",
    "label": {
      "vi": "Xem tất cả",
      "en": "View all"
    }
  },
  "quickViewLabel": {
    "vi": "Xem nhanh",
    "en": "Quick view"
  },
  "addLabel": {
    "vi": "Thêm vào yêu cầu báo giá",
    "en": "Add to quote request"
  },
  "addedLabel": {
    "vi": "Đã thêm",
    "en": "Added"
  },
  "compactAddLabel": {
    "vi": "Thêm báo giá",
    "en": "Add to quote"
  },
  "viewCartLabel": {
    "vi": "Xem giỏ báo giá",
    "en": "View quote cart"
  },
  "detailsLabel": {
    "vi": "Trang chi tiết",
    "en": "Details"
  },
  "warrantyLabel": {
    "vi": "Bảo hành",
    "en": "Warranty"
  },
  "contactPriceLabel": {
    "vi": "Liên hệ",
    "en": "Contact"
  }
} satisfies z.input<typeof productsSchema>;
