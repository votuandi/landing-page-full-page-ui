"use client";
import SafeImage from "@/components/template/SafeImage";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import { allProductsData } from "@/data/products";

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
            spec.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Category filter
    if (selectedCategory !== "Tất cả sản phẩm") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory,
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (product) =>
        product.priceNumber >= minPrice && product.priceNumber <= maxPrice,
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
    filteredAndSortedProducts.length / productsPerPage,
  );
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + productsPerPage,
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
          Math.min(1, (e.clientX - rect.left - 8) / (rect.width - 16)),
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
          Math.min(1, (touch.clientX - rect.left - 8) / (rect.width - 16)),
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Price Range Slider */}
              <div className="min-w-[320px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <span className="flex items-center justify-between">
                    <span>Khoảng giá</span>
                    <span className="text-emerald-600 font-semibold">
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
                      className="absolute h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-200"
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
                    className={`absolute w-5 h-5 bg-white border-3 border-emerald-500 rounded-full shadow-lg cursor-grab transition-all duration-200 hover:scale-110 select-none ${
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
                      0,
                    )}M đ`}
                  />
                  <div
                    className={`absolute w-5 h-5 bg-white border-3 border-emerald-500 rounded-full shadow-lg cursor-grab transition-all duration-200 hover:scale-110 select-none ${
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
                  className="group flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-200 text-sm font-medium"
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
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
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
                    <SafeImage
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category */}
                    <div className="text-xs text-emerald-600 font-medium mb-2">
                      {product.category}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12 group-hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Specifications */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {product.specs.slice(0, 2).map((spec, index) => (
                          <span
                            key={index}
                            className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded"
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
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
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
                      ? "text-emerald-600 bg-emerald-50 border border-emerald-300"
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
