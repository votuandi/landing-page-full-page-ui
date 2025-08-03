"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

interface BestSellerProduct {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  specs: string[];
  discount?: number;
  rating: number;
  salesCount: number;
  category: string;
}

// Best seller products (top rated and most sold items)
const bestSellerProducts: BestSellerProduct[] = [
  {
    id: 1,
    name: "Biến Tần Growatt MIN 3000TL-XE",
    price: "8,500,000đ",
    originalPrice: "9,200,000đ",
    image: "/images/product-1.jpg",
    specs: ["3kW", "MPPT Dual", "WiFi Monitor", "IP65"],
    discount: 8,
    rating: 4.8,
    salesCount: 450,
    category: "Biến Tần Inverter",
  },
  {
    id: 17,
    name: "Tấm Pin Canadian Solar BiHiKu7 CS7L-MS 580W",
    price: "3,200,000đ",
    originalPrice: "3,500,000đ",
    image: "/images/product-3.jpg",
    specs: ["580W", "Mono PERC", "21.4% Efficiency", "25 Year Warranty"],
    discount: 9,
    rating: 4.9,
    salesCount: 680,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
  },
  {
    id: 9,
    name: "Pin Lithium Pylontech US3000C",
    price: "18,500,000đ",
    originalPrice: "20,000,000đ",
    image: "/images/product-2.jpg",
    specs: ["3.55kWh", "LiFePO4", "6000 Cycles", "Modular Design"],
    discount: 8,
    rating: 4.7,
    salesCount: 320,
    category: "Pin Lưu Trữ Lithium",
  },
  {
    id: 25,
    name: "Luxpower SNA 5000 Hybrid Inverter",
    price: "15,800,000đ",
    originalPrice: "17,200,000đ",
    image: "/images/product-4.jpg",
    specs: ["5kW", "Hybrid MPPT", "Battery Ready", "Grid-Tie"],
    discount: 8,
    rating: 4.6,
    salesCount: 280,
    category: "Inverter Luxpower",
  },
  {
    id: 18,
    name: "Tấm Pin JinkoSolar Tiger Neo N-type 575W",
    price: "3,450,000đ",
    image: "/images/product-3.jpg",
    specs: ["575W", "N-Type TOPCon", "22.3% Efficiency", "Low Degradation"],
    rating: 4.8,
    salesCount: 520,
    category: "Tấm Pin Năng Lượng Mặt Trời Solar",
  },
  {
    id: 2,
    name: "Biến Tần Huawei SUN2000-5KTL-L1",
    price: "12,800,000đ",
    originalPrice: "14,000,000đ",
    image: "/images/product-1.jpg",
    specs: ["5kW", "Smart String", "AI Monitoring", "IP65"],
    discount: 9,
    rating: 4.7,
    salesCount: 380,
    category: "Biến Tần Inverter",
  },
];

export default function BestSellerSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const productsPerView = 4; // Desktop: 4 products per view
  const mobileProductsPerView = 2; // Mobile: 2 products per view

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const currentProductsPerView = isMobile
    ? mobileProductsPerView
    : productsPerView;

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + currentProductsPerView;
      if (nextIndex >= bestSellerProducts.length) {
        return 0; // Loop back to start
      }
      return nextIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        // Go to last complete set
        const lastCompleteSet =
          Math.floor((bestSellerProducts.length - 1) / currentProductsPerView) *
          currentProductsPerView;
        return lastCompleteSet;
      }
      return Math.max(0, prev - currentProductsPerView);
    });
  };

  const visibleProducts = bestSellerProducts.slice(
    currentIndex,
    currentIndex + currentProductsPerView
  );

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🏆 Sản Phẩm Bán Chạy
          </h2>
          <p className="text-lg text-gray-600">
            Những sản phẩm được khách hàng tin tưởng và lựa chọn nhiều nhất
          </p>
        </div>

        {/* Products Carousel with Navigation */}
        <div className="relative">
          {/* Navigation Controls - Centered */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            disabled={currentIndex === 0}
            style={{ transform: "translateY(-50%)", marginLeft: "-20px" }}
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            disabled={
              currentIndex + currentProductsPerView >= bestSellerProducts.length
            }
            style={{ transform: "translateY(-50%)", marginRight: "-20px" }}
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
          </button>

          {/* Products Grid with Touch Support */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 touch-pan-y transition-all duration-300 ease-in-out"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {visibleProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="block"
              >
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group relative cursor-pointer">
                  {/* Best Seller Badge */}
                  <div className="absolute top-2 left-2 z-20">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center">
                      <StarIcon className="w-3 h-3 mr-1" />
                      BEST
                    </div>
                  </div>

                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-2 right-2 z-20">
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
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Rating and Sales */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">
                          ({product.rating})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Đã bán {product.salesCount}
                      </span>
                    </div>

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
                        <span className="text-lg font-bold text-green-600">
                          {product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
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
        </div>
      </div>
    </section>
  );
}
