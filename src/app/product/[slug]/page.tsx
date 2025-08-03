import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailContent from "@/components/ProductDetailContent";

// Product data structure
interface ProductData {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  specs: string[];
  discount?: number;
  category: string;
  priceNumber: number;
  description?: string;
  features?: string[];
  warranty?: string;
  technicalSpecs?: Record<string, string>;
}

// Extended product data with more details for detail pages
const allProductsData: ProductData[] = [
  // Biến Tần Inverter
  {
    id: 1,
    name: "Biến Tần Growatt MIN 3000TL-XE",
    price: "8,500,000đ",
    originalPrice: "9,200,000đ",
    image: "/images/product-1.jpg",
    specs: ["3kW", "MPPT Dual", "WiFi Monitor", "IP65"],
    discount: 8,
    category: "Biến Tần Inverter",
    priceNumber: 8500000,
    description:
      "Biến tần năng lượng mặt trời Growatt MIN 3000TL-XE là giải pháp hoàn hảo cho các hệ thống điện mặt trời hộ gia đình với công suất 3kW. Sản phẩm được thiết kế với công nghệ tiên tiến, đảm bảo hiệu suất cao và độ bền vượt trội.",
    features: [
      "Hiệu suất chuyển đổi cao đến 97.6%",
      "Dual MPPT tracker với hiệu suất tối ưu",
      "Giám sát qua WiFi với ứng dụng di động",
      "Chống thấm nước chuẩn IP65",
      "Khởi động điện áp thấp",
      "Bảo vệ chống sét đánh",
      "Thiết kế nhỏ gọn, dễ lắp đặt",
      "Tuổi thọ thiết kế > 20 năm",
    ],
    warranty: "10 năm bảo hành từ nhà sản xuất",
    technicalSpecs: {
      "Công suất định mức": "3000W",
      "Điện áp DC tối đa": "500V",
      "Dòng điện DC tối đa": "11A + 11A",
      "Điện áp AC định mức": "220V",
      "Tần số AC": "50Hz",
      "Hiệu suất tối đa": "97.6%",
      "Chuẩn chống thấm": "IP65",
      "Nhiệt độ hoạt động": "-25°C ~ +60°C",
      "Kích thước": "315 × 240 × 121mm",
      "Trọng lượng": "7.5kg",
    },
  },
  {
    id: 2,
    name: "Biến Tần Huawei SUN2000-5KTL-L1",
    price: "12,800,000đ",
    originalPrice: "14,000,000đ",
    image: "/images/product-1.jpg",
    specs: ["5kW", "Smart String", "AI Monitoring", "IP65"],
    discount: 9,
    category: "Biến Tần Inverter",
    priceNumber: 12800000,
    description:
      "Biến tần thông minh Huawei SUN2000-5KTL-L1 với công nghệ AI tiên tiến, mang lại hiệu suất tối ưu và khả năng giám sát thông minh cho hệ thống năng lượng mặt trời 5kW.",
    features: [
      "Công nghệ Smart String với AI tích hợp",
      "Hiệu suất chuyển đổi lên đến 98.4%",
      "Giám sát cấp module thông qua optimizer",
      "Ứng dụng FusionSolar giám sát từ xa",
      "Khởi động nhanh và hoạt động ổn định",
      "Tự động phát hiện và cảnh báo lỗi",
      "Hỗ trợ cập nhật firmware OTA",
      "Thiết kế fanless - hoạt động êm ái",
    ],
    warranty: "10 năm bảo hành chính hãng Huawei",
    technicalSpecs: {
      "Công suất định mức": "5000W",
      "Điện áp DC tối đa": "600V",
      "Dải điện áp MPPT": "90V ~ 560V",
      "Số lượng MPPT": "2",
      "Điện áp AC định mức": "220V/380V",
      "Hiệu suất tối đa": "98.4%",
      "Chuẩn chống thấm": "IP65",
      "Nhiệt độ hoạt động": "-25°C ~ +60°C",
      "Kích thước": "370 × 365 × 156mm",
      "Trọng lượng": "17kg",
    },
  },
  {
    id: 9,
    name: "Pin Lithium Pylontech US3000C",
    price: "18,500,000đ",
    originalPrice: "20,000,000đ",
    image: "/images/product-2.jpg",
    specs: ["3.55kWh", "LiFePO4", "6000 Cycles", "Modular Design"],
    discount: 8,
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 18500000,
    description:
      "Pin lưu trữ năng lượng Pylontech US3000C sử dụng công nghệ LiFePO4 an toàn và bền bỉ. Với thiết kế modular linh hoạt, có thể mở rộng theo nhu cầu sử dụng.",
    features: [
      "Công nghệ LiFePO4 an toàn và bền bỉ",
      "Chu kỳ sạc xả lên đến 6000 lần",
      "Thiết kế modular, dễ dàng mở rộng",
      "BMS thông minh tích hợp",
      "Tự cân bằng các cell pin",
      "Giao tiếp CAN/RS485",
      "Hoạt động êm ái, không tiếng ồn",
      "Lắp đặt dễ dàng với thiết kế rack mount",
    ],
    warranty: "5 năm bảo hành toàn diện",
    technicalSpecs: {
      "Dung lượng": "3.55kWh",
      "Điện áp định mức": "48V",
      "Dung lượng Ah": "74Ah",
      "Công suất xả liên tục": "1.8kW",
      "Công suất xả tối đa": "3.6kW",
      "Hiệu suất sạc/xả": ">95%",
      "Chu kỳ sống": "6000+ cycles @ 80% DOD",
      "Nhiệt độ hoạt động": "-10°C ~ +50°C",
      "Kích thước": "442 × 420 × 133mm",
      "Trọng lượng": "35kg",
    },
  },
  {
    id: 17,
    name: "Tấm Pin Canadian Solar BiHiKu7 CS7L-MS 580W",
    price: "3,200,000đ",
    originalPrice: "3,500,000đ",
    image: "/images/product-3.jpg",
    specs: ["580W", "Mono PERC", "21.4% Efficiency", "25 Year Warranty"],
    discount: 9,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 3200000,
    description:
      "Tấm pin năng lượng mặt trời Canadian Solar BiHiKu7 với công suất 580W, hiệu suất cao 21.4%. Sử dụng công nghệ PERC tiên tiến và thiết kế Half-Cell để tối ưu hiệu năng.",
    features: [
      "Công nghệ Half-Cell PERC hiệu suất cao",
      "Hiệu suất module lên đến 21.4%",
      "Khả năng chống PID (Potential Induced Degradation)",
      "Chịu tải gió 2400Pa, tuyết 5400Pa",
      "Hoạt động tốt trong điều kiện ánh sáng yếu",
      "Hệ số nhiệt độ thấp",
      "Khung nhôm anodized chống ăn mòn",
      "Kính cường lực 3.2mm chống va đập",
    ],
    warranty: "25 năm bảo hành sản phẩm và công suất",
    technicalSpecs: {
      "Công suất định mức": "580W",
      "Hiệu suất module": "21.4%",
      "Điện áp mạch hở": "49.7V",
      "Dòng điện ngắn mạch": "14.25A",
      "Điện áp tại MPP": "41.7V",
      "Dòng điện tại MPP": "13.91A",
      "Hệ số nhiệt độ Pmax": "-0.34%/°C",
      "Nhiệt độ hoạt động": "-40°C ~ +85°C",
      "Kích thước": "2278 × 1134 × 35mm",
      "Trọng lượng": "28.1kg",
    },
  },
];

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = allProductsData.find((p) => p.id.toString() === slug);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại | Tâm Huỳnh Solar",
    };
  }

  return {
    title: `${product.name} | Tâm Huỳnh Solar`,
    description:
      product.description ||
      `${product.name} - ${product.specs.join(", ")} - Giá ${product.price}`,
    keywords: `${product.name}, ${
      product.category
    }, năng lượng mặt trời, ${product.specs.join(", ")}`,
    openGraph: {
      title: product.name,
      description:
        product.description || `${product.name} - ${product.specs.join(", ")}`,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = allProductsData.find((p) => p.id.toString() === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailContent product={product} />
    </div>
  );
}
