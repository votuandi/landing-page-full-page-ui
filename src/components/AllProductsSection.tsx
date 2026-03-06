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
  title: string;
  price: string | null;
  original_price?: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: {
    id: number;
    name: string;
  };
}

interface CategoryData {
  id: number;
  name: string;
  imageUrl: string | null;
  _count?: {
    products: number;
  };
}

const sortOptions = [
  { label: "Mặc định", value: "default" },
  { label: "Tên A-Z", value: "name-asc" },
  { label: "Tên Z-A", value: "name-desc" },
];

export default function AllProductsSection() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 12;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/product-categories?limit=100');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = '/api/products?isActive=true&limit=1000'; // Get all active products
        
        if (selectedCategoryId) {
          url += `&categoryId=${selectedCategoryId}`;
        }
        
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategoryId, searchTerm]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Sort products
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [products, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryId, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Calculate total products per category
  const getCategoryCount = (categoryId: number | null) => {
    if (categoryId === null) {
      return products.length;
    }
    return products.filter(p => p.category.id === categoryId).length;
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
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 search-filters">
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
                    setSelectedCategoryId(null);
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
            {/* All Products Category */}
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-stretch aspect-[5/2] transform ${
                selectedCategoryId === null
                  ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 ring-4 ring-primary-200/50 shadow-lg scale-[1.02]"
                  : "border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-25 hover:to-primary-50 shadow-sm hover:shadow-lg"
              }`}
            >
              <div
                className="w-1/3 flex-shrink-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url(/images/solar-panels-hero.jpg), url('/images/placeholder-product.svg')`,
                }}
              />
              <div className="flex-1 p-3 flex flex-col justify-center text-left min-w-0">
                <h4
                  className={`font-semibold text-sm mb-1 transition-colors leading-tight truncate ${
                    selectedCategoryId === null
                      ? "text-primary-700"
                      : "text-gray-900 group-hover:text-primary-600"
                  }`}
                >
                  Tất cả sản phẩm
                </h4>
                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    selectedCategoryId === null
                      ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-sm"
                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 group-hover:from-primary-100 group-hover:to-primary-200 group-hover:text-primary-700"
                  }`}
                >
                  {getCategoryCount(null)} sản phẩm
                </div>
              </div>
              {selectedCategoryId === null && (
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

            {/* Category Cards */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-stretch aspect-[5/2] transform ${
                  selectedCategoryId === category.id
                    ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 ring-4 ring-primary-200/50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-25 hover:to-primary-50 shadow-sm hover:shadow-lg"
                }`}
              >
                <div
                  className="w-1/3 flex-shrink-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${category.imageUrl || '/images/placeholder-product.svg'})`,
                  }}
                />
                <div className="flex-1 p-3 flex flex-col justify-center text-left min-w-0">
                  <h4
                    className={`font-semibold text-sm mb-1 transition-colors leading-tight truncate ${
                      selectedCategoryId === category.id
                        ? "text-primary-700"
                        : "text-gray-900 group-hover:text-primary-600"
                    }`}
                  >
                    {category.name}
                  </h4>
                  <div
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                      selectedCategoryId === category.id
                        ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-sm"
                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 group-hover:from-primary-100 group-hover:to-primary-200 group-hover:text-primary-700"
                    }`}
                  >
                    {getCategoryCount(category.id)} sản phẩm
                  </div>
                </div>
                {selectedCategoryId === category.id && (
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
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Đang tải sản phẩm...</div>
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {paginatedProducts.map((product) => {
              const discount = calculateDiscount(product.original_price, product.price);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer relative">
                    {/* Discount Badge */}
                    {discount && (
                      <div className="absolute top-2 right-2 z-10">
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
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-12 group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-base md:text-lg font-bold text-green-600">
                            {product.price || "Liên hệ"}
                          </span>
                          {product.original_price && (
                            <span className="text-xs md:text-sm text-gray-500 line-through">
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
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Không tìm thấy sản phẩm nào phù hợp với tiêu chí tìm kiếm
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategoryId(null);
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
