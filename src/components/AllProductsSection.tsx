"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface ProductData {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  specs: string[];
  discount?: number;
  category: string;
  priceNumber: number; // for sorting
}

// All products data (consolidated from ProductSection.tsx)
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
  },
  {
    id: 3,
    name: "Biến Tần SolarEdge SE7600H-RWS",
    price: "22,500,000đ",
    image: "/images/product-1.jpg",
    specs: ["7.6kW", "Power Optimizer", "HD-Wave", "StorEdge Ready"],
    category: "Biến Tần Inverter",
    priceNumber: 22500000,
  },
  {
    id: 4,
    name: "Biến Tần Fronius Symo 8.2-3-M",
    price: "28,900,000đ",
    originalPrice: "31,500,000đ",
    image: "/images/product-1.jpg",
    specs: ["8.2kW", "SnapINverter", "WiFi", "SuperFlex Design"],
    discount: 8,
    category: "Biến Tần Inverter",
    priceNumber: 28900000,
  },
  {
    id: 5,
    name: "Biến Tần ABB UNO-DM-6.0-TL-PLUS",
    price: "16,800,000đ",
    image: "/images/product-1.jpg",
    specs: ["6kW", "Transformerless", "React Quick", "IP65"],
    category: "Biến Tần Inverter",
    priceNumber: 16800000,
  },
  {
    id: 6,
    name: "Biến Tần Sungrow SG10RT",
    price: "19,200,000đ",
    originalPrice: "21,000,000đ",
    image: "/images/product-1.jpg",
    specs: ["10kW", "String Inverter", "AFCI Protection", "Smart O&M"],
    discount: 9,
    category: "Biến Tần Inverter",
    priceNumber: 19200000,
  },
  {
    id: 7,
    name: "Biến Tần SMA Sunny Boy 6.0",
    price: "24,500,000đ",
    image: "/images/product-1.jpg",
    specs: ["6kW", "OptiTrac Global Peak", "Webconnect", "Secure Power"],
    category: "Biến Tần Inverter",
    priceNumber: 24500000,
  },
  {
    id: 8,
    name: "Biến Tần GoodWe GW10K-DT",
    price: "18,600,000đ",
    originalPrice: "20,200,000đ",
    image: "/images/product-1.jpg",
    specs: ["10kW", "Dual MPPT", "WiFi Monitoring", "Anti-PID"],
    discount: 8,
    category: "Biến Tần Inverter",
    priceNumber: 18600000,
  },
  // Pin Lưu Trữ Lithium
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
  },
  {
    id: 10,
    name: "Pin Lithium BYD Battery-Box Premium LVS",
    price: "45,800,000đ",
    originalPrice: "49,500,000đ",
    image: "/images/product-2.jpg",
    specs: ["4kWh", "High Voltage", "10 Year Warranty", "Scalable"],
    discount: 7,
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 45800000,
  },
  {
    id: 11,
    name: "Pin Lithium Tesla Powerwall 2",
    price: "185,000,000đ",
    image: "/images/product-2.jpg",
    specs: ["13.5kWh", "AC Coupled", "Weather Resistant", "Mobile App"],
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 185000000,
  },
  {
    id: 12,
    name: "Pin Lithium Huawei LUNA2000-5kWh",
    price: "35,200,000đ",
    originalPrice: "38,000,000đ",
    image: "/images/product-2.jpg",
    specs: ["5kWh", "Smart Control", "Fast Charging", "Compact Design"],
    discount: 7,
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 35200000,
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
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 65500000,
  },
  {
    id: 14,
    name: "Pin Lithium Sonnen eco 8",
    price: "120,000,000đ",
    originalPrice: "135,000,000đ",
    image: "/images/product-2.jpg",
    specs: ["8kWh", "All-in-One", "Smart Grid Ready", "10,000 Cycles"],
    discount: 11,
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 120000000,
  },
  {
    id: 15,
    name: "Pin Lithium Alpha ESS SMILE5",
    price: "42,800,000đ",
    image: "/images/product-2.jpg",
    specs: ["5.7kWh", "Modular System", "EMS Integrated", "Safe Chemistry"],
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 42800000,
  },
  {
    id: 16,
    name: "Pin Lithium Goodwe Lynx Home F",
    price: "28,900,000đ",
    originalPrice: "31,500,000đ",
    image: "/images/product-2.jpg",
    specs: ["6.5kWh", "Stackable", "IP65 Rating", "Smart BMS"],
    discount: 8,
    category: "Pin Lưu Trữ Lithium",
    priceNumber: 28900000,
  },
  // Tấm Pin Năng Lượng Mặt Trời Solar
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
  },
  {
    id: 18,
    name: "Tấm Pin JinkoSolar Tiger Neo N-type 575W",
    price: "3,450,000đ",
    image: "/images/product-3.jpg",
    specs: ["575W", "N-Type TOPCon", "22.3% Efficiency", "Low Degradation"],
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 3450000,
  },
  {
    id: 19,
    name: "Tấm Pin Longi Hi-MO 6 Explorer LR5-72HTH 560W",
    price: "3,150,000đ",
    originalPrice: "3,400,000đ",
    image: "/images/product-3.jpg",
    specs: ["560W", "PERC Technology", "21.7% Efficiency", "Anti-LID"],
    discount: 7,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 3150000,
  },
  {
    id: 20,
    name: "Tấm Pin Trina Solar Vertex S+ TSM-DE21 570W",
    price: "3,380,000đ",
    image: "/images/product-3.jpg",
    specs: ["570W", "Multi-busbar", "22.1% Efficiency", "Low Temperature"],
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 3380000,
  },
  {
    id: 21,
    name: "Tấm Pin JA Solar DeepBlue 4.0X JAM72S30 540W",
    price: "2,950,000đ",
    originalPrice: "3,200,000đ",
    image: "/images/product-3.jpg",
    specs: ["540W", "PERC Half-cell", "20.9% Efficiency", "High Reliability"],
    discount: 8,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 2950000,
  },
  {
    id: 22,
    name: "Tấm Pin Risen Energy Titan RSM150-8-535M",
    price: "2,850,000đ",
    image: "/images/product-3.jpg",
    specs: ["535W", "Mono PERC", "20.7% Efficiency", "PID Resistant"],
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 2850000,
  },
  {
    id: 23,
    name: "Tấm Pin Hanwha Q CELLS Q.PEAK DUO L-G10.2 540W",
    price: "3,680,000đ",
    originalPrice: "3,950,000đ",
    image: "/images/product-3.jpg",
    specs: ["540W", "Q.ANTUM DUO", "20.9% Efficiency", "Hot-Spot Protect"],
    discount: 7,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 3680000,
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
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
    priceNumber: 4200000,
  },
  // Inverter Luxpower
  {
    id: 25,
    name: "Luxpower SNA 5000 Hybrid Inverter",
    price: "15,800,000đ",
    originalPrice: "17,200,000đ",
    image: "/images/product-4.jpg",
    specs: ["5kW", "Hybrid MPPT", "Battery Ready", "Grid-Tie"],
    discount: 8,
    category: "Inverter Luxpower",
    priceNumber: 15800000,
  },
  {
    id: 26,
    name: "Luxpower LXP 3600 ACS Inverter",
    price: "12,500,000đ",
    image: "/images/product-4.jpg",
    specs: ["3.6kW", "AC Coupled", "Smart Load", "WiFi Monitor"],
    category: "Inverter Luxpower",
    priceNumber: 12500000,
  },
  {
    id: 27,
    name: "Luxpower SNA 8000 Three Phase",
    price: "28,900,000đ",
    originalPrice: "31,500,000đ",
    image: "/images/product-4.jpg",
    specs: ["8kW", "3-Phase", "Commercial Grade", "High Efficiency"],
    discount: 8,
    category: "Inverter Luxpower",
    priceNumber: 28900000,
  },
  {
    id: 28,
    name: "Luxpower LXP 6000 ACS",
    price: "18,200,000đ",
    image: "/images/product-4.jpg",
    specs: ["6kW", "Pure Sine Wave", "UPS Function", "Remote Monitor"],
    category: "Inverter Luxpower",
    priceNumber: 18200000,
  },
  {
    id: 29,
    name: "Luxpower SNA 10K Hybrid",
    price: "32,800,000đ",
    originalPrice: "35,500,000đ",
    image: "/images/product-4.jpg",
    specs: ["10kW", "Dual MPPT", "Battery Management", "Grid Support"],
    discount: 8,
    category: "Inverter Luxpower",
    priceNumber: 32800000,
  },
  {
    id: 30,
    name: "Luxpower LXP 12K ACS Pro",
    price: "45,600,000đ",
    image: "/images/product-4.jpg",
    specs: ["12kW", "Professional", "Smart Grid", "Advanced Protection"],
    category: "Inverter Luxpower",
    priceNumber: 45600000,
  },
  {
    id: 31,
    name: "Luxpower SNA 15K Commercial",
    price: "58,900,000đ",
    originalPrice: "63,500,000đ",
    image: "/images/product-4.jpg",
    specs: ["15kW", "Commercial Use", "High Power", "Scalable System"],
    discount: 7,
    category: "Inverter Luxpower",
    priceNumber: 58900000,
  },
  {
    id: 32,
    name: "Luxpower LXP 20K Enterprise",
    price: "78,500,000đ",
    image: "/images/product-4.jpg",
    specs: ["20kW", "Enterprise Grade", "Multi-String", "Cloud Monitoring"],
    category: "Inverter Luxpower",
    priceNumber: 78500000,
  },
];

const categories = [
  {
    id: "all",
    name: "Tất cả sản phẩm",
    value: "Tất cả sản phẩm",
    image: "/images/solar-panels-hero.jpg",
    description: "Xem tất cả",
    count: 32,
  },
  {
    id: "inverter",
    name: "Biến Tần Inverter",
    value: "Biến Tần Inverter",
    image: "/images/solar-inverter-hero.jpg",
    description: "Thiết bị chuyển đổi điện",
    count: 8,
  },
  {
    id: "battery",
    name: "Pin Lưu Trữ",
    value: "Pin Lưu Trữ Lithium",
    image: "/images/solar-battery-hero.jpg",
    description: "Hệ thống lưu trữ năng lượng",
    count: 8,
  },
  {
    id: "solar-panel",
    name: "Tấm Pin Solar",
    value: "Tấm Pin Năng Lượng Mặt Trời Solar",
    image: "/images/solar-panels-hero.jpg",
    description: "Tấm pin năng lượng mặt trời",
    count: 8,
  },
  {
    id: "luxpower",
    name: "Inverter Luxpower",
    value: "Inverter Luxpower",
    image: "/images/solar-installation-hero.jpg",
    description: "Inverter thương hiệu Luxpower",
    count: 8,
  },
];

const sortOptions = [
  { label: "Mặc định", value: "default" },
  { label: "Tên A-Z", value: "name-asc" },
  { label: "Tên Z-A", value: "name-desc" },
  { label: "Giá thấp - cao", value: "price-asc" },
  { label: "Giá cao - thấp", value: "price-desc" },
];

export default function AllProductsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả sản phẩm");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200000000);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);

  const productsPerPage = 12;

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProductsData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.specs.some((spec) =>
            spec.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Category filter
    if (selectedCategory !== "Tất cả sản phẩm") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (product) =>
        product.priceNumber >= minPrice && product.priceNumber <= maxPrice
    );

    // Sort products
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        filtered.sort((a, b) => a.priceNumber - b.priceNumber);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.priceNumber - a.priceNumber);
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / productsPerPage
  );
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Drag and drop functionality for price thumbs
  const handleThumbMouseDown =
    (type: "min" | "max") => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(type);

      const handleMouseMove = (e: MouseEvent) => {
        const slider = (e.target as HTMLElement).closest(".relative");
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left - 8) / (rect.width - 16))
        ); // Adjust for padding
        const newPrice = Math.round((percent * 200000000) / 5000000) * 5000000; // Round to step

        if (type === "min" && newPrice <= maxPrice) {
          setMinPrice(newPrice);
        } else if (type === "max" && newPrice >= minPrice) {
          setMaxPrice(newPrice);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

  const handleThumbTouchStart =
    (type: "min" | "max") => (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(type);

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const slider = (e.target as HTMLElement).closest(".relative");
        if (!slider || !touch) return;

        const rect = slider.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (touch.clientX - rect.left - 8) / (rect.width - 16))
        ); // Adjust for padding
        const newPrice = Math.round((percent * 200000000) / 5000000) * 5000000; // Round to step

        if (type === "min" && newPrice <= maxPrice) {
          setMinPrice(newPrice);
        } else if (type === "max" && newPrice >= minPrice) {
          setMaxPrice(newPrice);
        }
      };

      const handleTouchEnd = () => {
        setIsDragging(null);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tất Cả Sản Phẩm
          </h2>
          <p className="text-lg text-gray-600">
            Khám phá bộ sưu tập đầy đủ các sản phẩm năng lượng mặt trời
          </p>
        </div>

        {/* Search Bar and Filters */}
        <div className="p-1 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Price Range Slider */}
              <div className="min-w-[320px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <span className="flex items-center justify-between">
                    <span>Khoảng giá</span>
                    <span className="text-blue-600 font-semibold">
                      {(minPrice / 1000000).toFixed(0)}M -{" "}
                      {maxPrice === 200000000
                        ? "200M+"
                        : (maxPrice / 1000000).toFixed(0) + "M"}{" "}
                      đ
                    </span>
                  </span>
                </label>

                <div className="relative px-2">
                  {/* Background track */}
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    {/* Active range highlight */}
                    <div
                      className="absolute h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-200"
                      style={{
                        left: `${(minPrice / 200000000) * 100}%`,
                        width: `${((maxPrice - minPrice) / 200000000) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Min Price Slider */}
                  <input
                    type="range"
                    min="0"
                    max="200000000"
                    step="5000000"
                    value={minPrice}
                    onChange={(e) => {
                      const newMinPrice = parseInt(e.target.value);
                      if (newMinPrice <= maxPrice) {
                        setMinPrice(newMinPrice);
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-2 price-slider opacity-0 pointer-events-auto"
                    style={{ zIndex: 1 }}
                  />

                  {/* Max Price Slider */}
                  <input
                    type="range"
                    min="0"
                    max="200000000"
                    step="5000000"
                    value={maxPrice}
                    onChange={(e) => {
                      const newMaxPrice = parseInt(e.target.value);
                      if (newMaxPrice >= minPrice) {
                        setMaxPrice(newMaxPrice);
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-2 price-slider opacity-0 pointer-events-auto"
                    style={{ zIndex: 2 }}
                  />

                  {/* Custom Thumbs */}
                  <div
                    className={`absolute w-5 h-5 bg-white border-3 border-blue-500 rounded-full shadow-lg cursor-grab transition-all duration-200 hover:scale-110 select-none ${
                      isDragging === "min"
                        ? "cursor-grabbing scale-110 shadow-xl"
                        : ""
                    }`}
                    style={{
                      left: `calc(${(minPrice / 200000000) * 100}% - 10px)`,
                      top: "-6px",
                      zIndex: isDragging === "min" ? 10 : 3,
                    }}
                    onMouseDown={handleThumbMouseDown("min")}
                    onTouchStart={handleThumbTouchStart("min")}
                    title={`Giá tối thiểu: ${(minPrice / 1000000).toFixed(
                      0
                    )}M đ`}
                  />
                  <div
                    className={`absolute w-5 h-5 bg-white border-3 border-blue-500 rounded-full shadow-lg cursor-grab transition-all duration-200 hover:scale-110 select-none ${
                      isDragging === "max"
                        ? "cursor-grabbing scale-110 shadow-xl"
                        : ""
                    }`}
                    style={{
                      left: `calc(${(maxPrice / 200000000) * 100}% - 10px)`,
                      top: "-6px",
                      zIndex: isDragging === "max" ? 10 : 4,
                    }}
                    onMouseDown={handleThumbMouseDown("max")}
                    onTouchStart={handleThumbTouchStart("max")}
                    title={`Giá tối đa: ${
                      maxPrice === 200000000
                        ? "200M+"
                        : (maxPrice / 1000000).toFixed(0) + "M"
                    } đ`}
                  />
                </div>

                {/* Price scale labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-3 px-2">
                  <span>0M</span>
                  <span>5M</span>
                  <span>10M</span>
                  <span>20M</span>
                  <span>50M</span>
                  <span>200M</span>
                </div>
              </div>

              {/* Sort Filter */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white transition-all duration-300 text-gray-700 font-medium shadow-sm hover:shadow-md cursor-pointer text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters & Results Count */}
              <div className="flex items-center gap-4 mt-auto">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("Tất cả sản phẩm");
                    setMinPrice(0);
                    setMaxPrice(200000000);
                    setSortBy("default");
                  }}
                  className="group flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 text-sm font-medium"
                  title="Đặt lại bộ lọc"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="hidden sm:inline">Đặt lại</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Danh mục sản phẩm
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.value)}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-stretch aspect-[5/2] transform ${
                  selectedCategory === category.value
                    ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 ring-4 ring-primary-200/50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-25 hover:to-primary-50 shadow-sm hover:shadow-lg"
                }`}
              >
                {/* Category Image */}
                <div
                  className="w-1/3 flex-shrink-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${category.image}), url('/images/placeholder-product.svg')`,
                  }}
                />

                {/* Category Info */}
                <div className="flex-1 p-3 flex flex-col justify-center text-left min-w-0">
                  <h4
                    className={`font-semibold text-sm mb-1 transition-colors leading-tight truncate ${
                      selectedCategory === category.value
                        ? "text-primary-700"
                        : "text-gray-900 group-hover:text-primary-600"
                    }`}
                  >
                    {category.name}
                  </h4>
                  <div
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                      selectedCategory === category.value
                        ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-sm"
                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 group-hover:from-primary-100 group-hover:to-primary-200 group-hover:text-primary-700"
                    }`}
                  >
                    {category.count} sản phẩm
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedCategory === category.value && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 whitespace-nowrap mb-2">
          <span className="font-semibold">
            {filteredAndSortedProducts.length}
          </span>{" "}
          sản phẩm
        </div>

        {/* Products Grid */}
        {paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {paginatedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                        -{product.discount}%
                      </span>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = "/images/placeholder-product.svg";
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category */}
                    <div className="text-xs text-blue-600 font-medium mb-2">
                      {product.category}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Specifications */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {product.specs.slice(0, 2).map((spec, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Không tìm thấy sản phẩm nào phù hợp với tiêu chí tìm kiếm
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Tất cả sản phẩm");
                setMinPrice(0);
                setMaxPrice(200000000);
                setSortBy("default");
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Trước
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
              let pageNumber;
              if (totalPages <= 7) {
                pageNumber = index + 1;
              } else if (currentPage <= 4) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNumber = totalPages - 6 + index;
              } else {
                pageNumber = currentPage - 3 + index;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === pageNumber
                      ? "text-blue-600 bg-blue-50 border border-blue-300"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
