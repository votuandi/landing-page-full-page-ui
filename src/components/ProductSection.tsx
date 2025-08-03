"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  specs: string[];
  discount?: number;
}

const productCategories = {
  "Biến Tần Inverter": [
    {
      id: 1,
      name: "Biến Tần Growatt MIN 3000TL-XE",
      price: "8,500,000đ",
      originalPrice: "9,200,000đ",
      image: "/images/product-1.jpg",
      specs: ["3kW", "MPPT Dual", "WiFi Monitor", "IP65"],
      discount: 8,
    },
    {
      id: 2,
      name: "Biến Tần Huawei SUN2000-5KTL-L1",
      price: "12,800,000đ",
      originalPrice: "14,000,000đ",
      image: "/images/product-1.jpg",
      specs: ["5kW", "Smart String", "AI Monitoring", "IP65"],
      discount: 9,
    },
    {
      id: 3,
      name: "Biến Tần SolarEdge SE7600H-RWS",
      price: "22,500,000đ",
      image: "/images/product-1.jpg",
      specs: ["7.6kW", "Power Optimizer", "HD-Wave", "StorEdge Ready"],
    },
    {
      id: 4,
      name: "Biến Tần Fronius Symo 8.2-3-M",
      price: "28,900,000đ",
      originalPrice: "31,500,000đ",
      image: "/images/product-1.jpg",
      specs: ["8.2kW", "SnapINverter", "WiFi", "SuperFlex Design"],
      discount: 8,
    },
    {
      id: 5,
      name: "Biến Tần ABB UNO-DM-6.0-TL-PLUS",
      price: "16,800,000đ",
      image: "/images/product-1.jpg",
      specs: ["6kW", "Transformerless", "React Quick", "IP65"],
    },
    {
      id: 6,
      name: "Biến Tần Sungrow SG10RT",
      price: "19,200,000đ",
      originalPrice: "21,000,000đ",
      image: "/images/product-1.jpg",
      specs: ["10kW", "String Inverter", "AFCI Protection", "Smart O&M"],
      discount: 9,
    },
    {
      id: 7,
      name: "Biến Tần SMA Sunny Boy 6.0",
      price: "24,500,000đ",
      image: "/images/product-1.jpg",
      specs: ["6kW", "OptiTrac Global Peak", "Webconnect", "Secure Power"],
    },
    {
      id: 8,
      name: "Biến Tần GoodWe GW10K-DT",
      price: "18,600,000đ",
      originalPrice: "20,200,000đ",
      image: "/images/product-1.jpg",
      specs: ["10kW", "Dual MPPT", "WiFi Monitoring", "Anti-PID"],
      discount: 8,
    },
  ],
  "Pin Lưu Trữ Lithium": [
    {
      id: 9,
      name: "Pin Lithium Pylontech US3000C",
      price: "18,500,000đ",
      originalPrice: "20,000,000đ",
      image: "/images/product-2.jpg",
      specs: ["3.55kWh", "LiFePO4", "6000 Cycles", "Modular Design"],
      discount: 8,
    },
    {
      id: 10,
      name: "Pin Lithium BYD Battery-Box Premium LVS",
      price: "45,800,000đ",
      originalPrice: "49,500,000đ",
      image: "/images/product-2.jpg",
      specs: ["4kWh", "High Voltage", "10 Year Warranty", "Scalable"],
      discount: 7,
    },
    {
      id: 11,
      name: "Pin Lithium Tesla Powerwall 2",
      price: "185,000,000đ",
      image: "/images/product-2.jpg",
      specs: ["13.5kWh", "AC Coupled", "Weather Resistant", "Mobile App"],
    },
    {
      id: 12,
      name: "Pin Lithium Huawei LUNA2000-5kWh",
      price: "35,200,000đ",
      originalPrice: "38,000,000đ",
      image: "/images/product-2.jpg",
      specs: ["5kWh", "Smart Control", "Fast Charging", "Compact Design"],
      discount: 7,
    },
    {
      id: 13,
      name: "Pin Lithium LG Chem RESU10H",
      price: "65,500,000đ",
      image: "/images/product-2.jpg",
      specs: [
        "9.8kWh",
        "High Energy Density",
        "10 Year Warranty",
        "Indoor/Outdoor",
      ],
    },
    {
      id: 14,
      name: "Pin Lithium Sonnen eco 8",
      price: "120,000,000đ",
      originalPrice: "135,000,000đ",
      image: "/images/product-2.jpg",
      specs: ["8kWh", "All-in-One", "Smart Grid Ready", "10,000 Cycles"],
      discount: 11,
    },
    {
      id: 15,
      name: "Pin Lithium Alpha ESS SMILE5",
      price: "42,800,000đ",
      image: "/images/product-2.jpg",
      specs: ["5.7kWh", "Modular System", "EMS Integrated", "Safe Chemistry"],
    },
    {
      id: 16,
      name: "Pin Lithium Goodwe Lynx Home F",
      price: "28,900,000đ",
      originalPrice: "31,500,000đ",
      image: "/images/product-2.jpg",
      specs: ["6.5kWh", "Stackable", "IP65 Rating", "Smart BMS"],
      discount: 8,
    },
  ],
  "Tấm Pin Năng Lượng Mặt Trời Solar": [
    {
      id: 17,
      name: "Tấm Pin Canadian Solar BiHiKu7 CS7L-MS 580W",
      price: "3,200,000đ",
      originalPrice: "3,500,000đ",
      image: "/images/product-3.jpg",
      specs: ["580W", "Mono PERC", "21.4% Efficiency", "25 Year Warranty"],
      discount: 9,
    },
    {
      id: 18,
      name: "Tấm Pin JinkoSolar Tiger Neo N-type 575W",
      price: "3,450,000đ",
      image: "/images/product-3.jpg",
      specs: ["575W", "N-Type TOPCon", "22.3% Efficiency", "Low Degradation"],
    },
    {
      id: 19,
      name: "Tấm Pin Longi Hi-MO 6 Explorer LR5-72HTH 560W",
      price: "3,150,000đ",
      originalPrice: "3,400,000đ",
      image: "/images/product-3.jpg",
      specs: ["560W", "PERC Technology", "21.7% Efficiency", "Anti-LID"],
      discount: 7,
    },
    {
      id: 20,
      name: "Tấm Pin Trina Solar Vertex S+ TSM-DE21 570W",
      price: "3,380,000đ",
      image: "/images/product-3.jpg",
      specs: ["570W", "Multi-busbar", "22.1% Efficiency", "Low Temperature"],
    },
    {
      id: 21,
      name: "Tấm Pin JA Solar DeepBlue 4.0X JAM72S30 540W",
      price: "2,950,000đ",
      originalPrice: "3,200,000đ",
      image: "/images/product-3.jpg",
      specs: ["540W", "PERC Half-cell", "20.9% Efficiency", "High Reliability"],
      discount: 8,
    },
    {
      id: 22,
      name: "Tấm Pin Risen Energy Titan RSM150-8-535M",
      price: "2,850,000đ",
      image: "/images/product-3.jpg",
      specs: ["535W", "Mono PERC", "20.7% Efficiency", "PID Resistant"],
    },
    {
      id: 23,
      name: "Tấm Pin Hanwha Q CELLS Q.PEAK DUO L-G10.2 540W",
      price: "3,680,000đ",
      originalPrice: "3,950,000đ",
      image: "/images/product-3.jpg",
      specs: ["540W", "Q.ANTUM DUO", "20.9% Efficiency", "Hot-Spot Protect"],
      discount: 7,
    },
    {
      id: 24,
      name: "Tấm Pin First Solar Series 6 Plus 445W",
      price: "4,200,000đ",
      image: "/images/product-3.jpg",
      specs: [
        "445W",
        "CdTe Thin Film",
        "19.5% Efficiency",
        "Superior Performance",
      ],
    },
  ],
  "Inverter Luxpower": [
    {
      id: 25,
      name: "Luxpower SNA 5000 Hybrid Inverter",
      price: "15,800,000đ",
      originalPrice: "17,200,000đ",
      image: "/images/product-4.jpg",
      specs: ["5kW", "Hybrid MPPT", "Battery Ready", "Grid-Tie"],
      discount: 8,
    },
    {
      id: 26,
      name: "Luxpower LXP 3600 ACS Inverter",
      price: "12,500,000đ",
      image: "/images/product-4.jpg",
      specs: ["3.6kW", "AC Coupled", "Smart Load", "WiFi Monitor"],
    },
    {
      id: 27,
      name: "Luxpower SNA 8000 Three Phase",
      price: "28,900,000đ",
      originalPrice: "31,500,000đ",
      image: "/images/product-4.jpg",
      specs: ["8kW", "3-Phase", "Commercial Grade", "High Efficiency"],
      discount: 8,
    },
    {
      id: 28,
      name: "Luxpower LXP 6000 ACS",
      price: "18,200,000đ",
      image: "/images/product-4.jpg",
      specs: ["6kW", "Pure Sine Wave", "UPS Function", "Remote Monitor"],
    },
    {
      id: 29,
      name: "Luxpower SNA 10K Hybrid",
      price: "32,800,000đ",
      originalPrice: "35,500,000đ",
      image: "/images/product-4.jpg",
      specs: ["10kW", "Dual MPPT", "Battery Management", "Grid Support"],
      discount: 8,
    },
    {
      id: 30,
      name: "Luxpower LXP 12K ACS Pro",
      price: "45,600,000đ",
      image: "/images/product-4.jpg",
      specs: ["12kW", "Professional", "Smart Grid", "Advanced Protection"],
    },
    {
      id: 31,
      name: "Luxpower SNA 15K Commercial",
      price: "58,900,000đ",
      originalPrice: "63,500,000đ",
      image: "/images/product-4.jpg",
      specs: ["15kW", "Commercial Use", "High Power", "Scalable System"],
      discount: 7,
    },
    {
      id: 32,
      name: "Luxpower LXP 20K Enterprise",
      price: "78,500,000đ",
      image: "/images/product-4.jpg",
      specs: ["20kW", "Enterprise Grade", "Multi-String", "Cloud Monitoring"],
    },
  ],
};

interface ProductCarouselProps {
  products: Product[];
  categoryName: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  categoryName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);

  const productsPerView = 4; // Show 4 products at a time on desktop
  const mobileProductsInitial = 4; // Show 2x2 products initially on mobile

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + productsPerView >= products.length ? 0 : prev + productsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0
        ? Math.max(0, products.length - productsPerView)
        : Math.max(0, prev - productsPerView)
    );
  };

  // Determine which products to show
  const getVisibleProducts = () => {
    if (isMobile) {
      return showAllMobile
        ? products
        : products.slice(0, mobileProductsInitial);
    }
    return products.slice(currentIndex, currentIndex + productsPerView);
  };

  const visibleProducts = getVisibleProducts();
  const hasMoreProducts =
    isMobile && !showAllMobile && products.length > mobileProductsInitial;

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900">{categoryName}</h3>
        {/* Desktop navigation arrows - hidden on mobile */}
        {!isMobile && (
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              disabled={currentIndex === 0}
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              disabled={currentIndex + productsPerView >= products.length}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <StaggeredScrollAnimation
        animation="fall-down"
        staggerDelay={150}
        duration={800}
        threshold={0.1}
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="block"
          >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              {product.discount && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                  <span className="bg-red-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-xs md:text-sm font-medium">
                    -{product.discount}%
                  </span>
                </div>
              )}

              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = "/images/placeholder-product.svg";
                  }}
                />
              </div>

              <div className="p-3 md:p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12">
                  {product.name}
                </h4>

                <div className="mb-2 md:mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-base md:text-lg font-bold text-green-600">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs md:text-sm text-gray-500 line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 md:mb-4">
                  <div className="flex flex-wrap gap-1">
                    {product.specs.slice(0, 2).map((spec, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </StaggeredScrollAnimation>

      {/* Mobile "Xem thêm" button */}
      {hasMoreProducts && (
        <div className="flex justify-end mt-6 md:hidden">
          <button
            onClick={() => setShowAllMobile(true)}
            className="text-blue-600 hover:text-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            Xem thêm &gt;
          </button>
        </div>
      )}

      {/* Desktop dots indicator - hidden on mobile */}
      {!isMobile && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from(
            { length: Math.ceil(products.length / productsPerView) },
            (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * productsPerView)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  Math.floor(currentIndex / productsPerView) === index
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

const ProductSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sản Phẩm Năng Lượng Mặt Trời
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Khám phá bộ sưu tập sản phẩm năng lượng mặt trời chất lượng cao từ
            các thương hiệu hàng đầu thế giới. Giải pháp hoàn chỉnh cho hệ thống
            điện mặt trời của bạn.
          </p>
        </div>

        {Object.entries(productCategories).map(([categoryName, products]) => (
          <ProductCarousel
            key={categoryName}
            categoryName={categoryName}
            products={products}
          />
        ))}

        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg font-medium">
            Xem Tất Cả Sản Phẩm
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
