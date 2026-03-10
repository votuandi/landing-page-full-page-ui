"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";

interface ProductCategory {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
  introduction?: string | null;
  description?: string | null;
  specifications?: string | null;
  guarantee?: string | null;
  categoryId: number;
  category?: ProductCategory;
  price?: string | null;
  original_price?: string | null;
  isActive: boolean;
  isBestSeller: boolean;
  showInHomePage: boolean;
  imageUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for display
interface DisplayProduct {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  discount?: number;
  introduction?: string;
}

// Helper function to convert DB product to display format
const convertToDisplayProduct = (product: Product): DisplayProduct => {
  // Calculate discount percentage if both prices exist
  let discount: number | undefined;
  if (product.price && product.original_price) {
    try {
      const price = parseFloat(product.price.replace(/[^\d.]/g, ''));
      const originalPrice = parseFloat(product.original_price.replace(/[^\d.]/g, ''));
      if (!isNaN(price) && !isNaN(originalPrice) && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }
    } catch {
      // Ignore discount calculation errors
    }
  }

  return {
    id: product.id,
    name: product.title,
    price: product.price || 'Liên hệ',
    originalPrice: product.original_price || undefined,
    image: product.imageUrl || '/images/placeholder-product.svg',
    introduction: product.introduction ?? "",
    discount,
  };
};

interface ProductCarouselProps {
  products: DisplayProduct[];
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
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr"
      >
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="block h-full"
          >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
              {product.discount && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                  <span className="bg-red-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-xs md:text-sm font-medium">
                    -{product.discount}%
                  </span>
                </div>
              )}

              <div className="relative aspect-square bg-gray-100 overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = "/images/placeholder-product.svg";
                  }}
                />
              </div>

              <div className="p-3 md:p-4 flex flex-col flex-grow justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base">
                    {product.name}
                  </h4>
                  <p
                    className="text-gray-700 text-xs line-clamp-2 mb-2"
                  >
                    {product?.introduction}
                  </p>
                </div>
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
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${Math.floor(currentIndex / productsPerView) === index
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

interface ProductSectionProps {
  initialProducts?: Product[];
}

const ProductSection: React.FC<ProductSectionProps> = ({ initialProducts }) => {
  const [products, setProducts] = useState<DisplayProduct[]>(
    () => (initialProducts?.length ? initialProducts.map(convertToDisplayProduct) : [])
  );
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts?.length) {
      setProducts(initialProducts.map(convertToDisplayProduct));
      setLoading(false);
      return;
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialProducts?.length) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products?showInHomePage=true&isActive=true&limit=100&orderBy=order&order=asc');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const result = await response.json();
        const dbProducts: Product[] = result.data || [];
        const displayProducts = dbProducts.map(convertToDisplayProduct);
        setProducts(displayProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialProducts?.length]);

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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Thử lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chưa có sản phẩm nào được hiển thị.</p>
          </div>
        ) : (
          <ProductCarousel
            categoryName="Sản Phẩm Nổi Bật"
            products={products}
          />
        )}

        <div className="text-center mt-12">
          <Link href="/product">
            <button className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg font-medium">
              Xem Tất Cả Sản Phẩm
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
