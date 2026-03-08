"use client";

import { useAppSelector } from "@/lib/hooks";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ProductImage {
  id: number;
  url: string;
  type: string;
  createdAt: string;
}

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

interface RelatedProduct {
  id: number;
  title: string;
  imageUrl: string | null;
  price: string | null;
  category: { id: number; name: string };
}

interface ProductDetailContentProps {
  product: ProductData;
  relatedProducts?: RelatedProduct[];
}

export default function ProductDetailContent({
  product,
  relatedProducts = [],
}: ProductDetailContentProps) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "specs" | "warranty"
  >("description");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const { offices } = useAppSelector((state) => state.offices);
  const mainOffice = offices.find((office) => office.isMainOffice) || offices[0];

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleCarouselNext = () => {
    const allImages = [product.image, ...productImages];
    if (carouselStartIndex + 4 < allImages.length) {
      setCarouselStartIndex(carouselStartIndex + 1);
    }
  };

  const handleCarouselPrev = () => {
    if (carouselStartIndex > 0) {
      setCarouselStartIndex(carouselStartIndex - 1);
    }
  };

  // Fetch product images from API
  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        setLoadingImages(true);
        const response = await fetch(`/api/products/${product.id}/images`);

        if (response.ok) {
          const data = await response.json()
          const allImages = Array.isArray(data.images) ? [product.image, ...data.images.map((img: any) => img.url)] : [product.image];
          setProductImages(allImages);
        } else {
          console.error('Failed to fetch product images');
          setProductImages([]);
        }
      } catch (error) {
        console.error('Error fetching product images:', error);
        setProductImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProductImages();
  }, [product.id, product.image]);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(product.image);
    setImageError(false);
  }, [product.id, product.image]);

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
                src={selectedImage}
                alt={`${product.name} - ${product.category} - Sản phẩm năng lượng mặt trời chất lượng cao`}
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

          {/* Thumbnail images carousel */}
          <div className="relative">
            {loadingImages ? (
              // Loading skeleton
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative h-20 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                {(() => {
                  const allImages = [product.image, ...productImages];
                  const visibleImages = allImages.slice(carouselStartIndex, carouselStartIndex + 4);
                  const showPrevButton = carouselStartIndex > 0;
                  const showNextButton = carouselStartIndex + 4 < allImages.length;

                  return (
                    <>
                      {/* Previous button */}
                      {showPrevButton && (
                        <button
                          onClick={handleCarouselPrev}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all"
                          aria-label="Previous images"
                        >
                          <svg
                            className="w-5 h-5 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Carousel images */}
                      <div className="grid grid-cols-4 gap-2">
                        {visibleImages.map((img, index) => {
                          const actualIndex = carouselStartIndex + index;
                          return (
                            <div
                              key={actualIndex}
                              onClick={() => {
                                setSelectedImage(img);
                                setImageError(false);
                              }}
                              className={`relative h-20 bg-gray-100 rounded border-2 cursor-pointer transition-all ${selectedImage === img
                                ? "border-solar-blue"
                                : "border-transparent hover:border-solar-blue"
                                }`}
                            >
                              <Image
                                src={img}
                                alt={`${product.name} - Hình ảnh ${actualIndex + 1} - ${product.category} năng lượng mặt trời`}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          );
                        })}

                        {/* Show placeholder if less than 4 visible images */}
                        {visibleImages.length < 4 &&
                          [...Array(4 - visibleImages.length)].map((_, index) => (
                            <div
                              key={`placeholder-${index}`}
                              className="relative h-20 bg-gray-100 rounded border-2 border-transparent"
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-8 h-8"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Next button */}
                      {showNextButton && (
                        <button
                          onClick={handleCarouselNext}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all"
                          aria-label="Next images"
                        >
                          <svg
                            className="w-5 h-5 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
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
                <span>Hotline: {mainOffice?.phone || ""}</span>
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden rich-text-content">
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

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/product/${relatedProduct.id}`}
                className="group"
              >
                <article className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {relatedProduct.imageUrl ? (
                      <Image
                        src={relatedProduct.imageUrl}
                        alt={`${relatedProduct.title} - ${relatedProduct.category.name} - Sản phẩm năng lượng mặt trời`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-solar-blue font-medium mb-1 block">
                      {relatedProduct.category.name}
                    </span>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-solar-blue transition-colors">
                      {relatedProduct.title}
                    </h3>
                    {relatedProduct.price && (
                      <p className="text-lg font-bold text-solar-blue">
                        {relatedProduct.price}
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}

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
