"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  description?: string | React.ReactNode;
  features?: string[];
  warranty?: string | React.ReactNode;
  technicalSpecs?: Record<string, string | React.ReactNode>;
  introduction?: string;
}

interface ProductDetailContentProps {
  product: ProductData;
}

export default function ProductDetailContent({
  product,
}: ProductDetailContentProps) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "specs" | "warranty"
  >("description");

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  useEffect(() => {
    console.log('🚀 product', product);
  }, [product]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-solar-blue">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/product" className="hover:text-solar-blue">
          Sản phẩm
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
            {!imageError ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-20 h-20 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span>Ảnh sản phẩm</span>
                </div>
              </div>
            )}

            {/* Discount Badge */}
            {product.discount && (
              <div className="absolute top-4 left-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  -{product.discount}%
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail images (placeholder for future enhancement) */}
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="relative h-20 bg-gray-100 rounded border-2 border-transparent hover:border-solar-blue cursor-pointer"
              >
                <Image
                  src={product.image}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Category */}
          <div>
            <span className="bg-solar-blue/10 text-solar-blue px-3 py-1 rounded-full text-sm font-medium">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-solar-blue">
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xl text-gray-500 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-2 gap-4">
            {product.specs.map((spec, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-gray-600"
              >
                <svg
                  className="w-5 h-5 text-green-500"
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
                <span>{spec}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.introduction}
            </p>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Số lượng:</span>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <button className="bg-solar-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Thêm vào giỏ hàng
              </button> */}
              <a href={'/contact-us'}>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Mua ngay
                </button>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Liên hệ tư vấn
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-solar-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Hotline: 0909019234</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-solar-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Email: info@phanphoisolar.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "description", label: "Mô tả sản phẩm" },
              { id: "specs", label: "Thông số kỹ thuật" },
              { id: "warranty", label: "Bảo hành" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? "border-solar-blue text-solar-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "description" && (
            <div className="space-y-6">
              {product.description ? (
                <div>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có mô tả sản phẩm</p>
              )}

              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tính năng nổi bật
                  </h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg
                          className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "specs" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông số kỹ thuật chi tiết
              </h3>
              {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(product.technicalSpecs).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="border border-gray-200 rounded p-4"
                      >
                        <div className="font-medium text-gray-900 mb-2">{key}</div>
                        <div className="text-gray-600 whitespace-pre-wrap">{value}</div>
                      </div>
                    )
                  )}
                </div>
              ) : product.specs && product.specs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.specs.map((spec, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded p-3"
                    >
                      <div className="text-gray-700">{spec}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có thông số kỹ thuật</p>
              )}
            </div>
          )}

          {activeTab === "warranty" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chính sách bảo hành
              </h3>
              <div className="space-y-4">
                {product.warranty && product.warranty !== "Bảo hành theo chính sách nhà sản xuất" ? (
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-green-800">
                        Thông tin bảo hành
                      </span>
                    </div>
                    <div className="text-green-700 whitespace-pre-wrap">{product.warranty}</div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-blue-700">Bảo hành theo chính sách nhà sản xuất</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Products */}
      <div className="flex justify-center mt-8">
        <Link
          href="/product"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Quay lại danh sách sản phẩm
        </Link>
      </div>
    </div>
  );
}
