"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

interface BestSellerProduct {
  id: number;
  title: string;
  price: string | null;
  original_price?: string | null;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
  };
  isBestSeller: boolean;
}

interface BestSellerSectionProps {
  initialProducts?: BestSellerProduct[];
}

export default function BestSellerSection({ initialProducts }: BestSellerSectionProps = {}) {
  const [bestSellerProducts, setBestSellerProducts] = useState<BestSellerProduct[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const productsPerView = 4; // Desktop: 4 products per view
  const mobileProductsPerView = 2; // Mobile: 2 products per view

  useEffect(() => {
    if (initialProducts?.length) {
      setBestSellerProducts(initialProducts);
      setLoading(false);
    }
  }, [initialProducts]);

  // Fetch best seller products when no initial data
  useEffect(() => {
    if (initialProducts?.length) return;

    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?isBestSeller=true&isActive=true&limit=12');
        if (!response.ok) {
          throw new Error('Failed to fetch best sellers');
        }
        const data = await response.json();
        setBestSellerProducts(data.data || []);
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setBestSellerProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [initialProducts?.length]);

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

  // Calculate discount percentage
  const calculateDiscount = (original: string | null | undefined, current: string | null) => {
    if (!original || !current) return undefined;
    const origNum = parseFloat(original.replace(/[^0-9]/g, ''));
    const currNum = parseFloat(current.replace(/[^0-9]/g, ''));
    if (origNum && currNum && origNum > currNum) {
      return Math.round(((origNum - currNum) / origNum) * 100);
    }
    return undefined;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Đang tải sản phẩm bán chạy...</div>
          </div>
        </div>
      </section>
    );
  }

  if (bestSellerProducts.length === 0) {
    return null; // Don't show section if no best sellers
  }

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
            {visibleProducts.map((product) => {
              const discount = calculateDiscount(product.original_price, product.price);
              return (
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
                    {discount && (
                      <div className="absolute top-2 right-2 z-20">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          -{discount}%
                        </span>
                      </div>
                    )}

                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={product.imageUrl || "/images/placeholder-product.svg"}
                        alt={product.title}
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
                        {product.category.name}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12 group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>

                      {/* Rating and Sales - Placeholder for now */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-3 h-3 ${
                                  i < 4 ? "text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 ml-1">
                            (4.8)
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Bán chạy</span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-600">
                            {product.price || "Liên hệ"}
                          </span>
                          {product.original_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {product.original_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
