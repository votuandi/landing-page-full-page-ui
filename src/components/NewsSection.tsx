"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import NewsCard from "./NewsCard";

export default function NewsSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we're on mobile
  useEffect(() => {
    if (!mounted) return;

    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768); // md breakpoint
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [mounted]);

  const newsArticles = [
    {
      id: 1,
      title: "Điện mặt trời được bán tối đa 20% công suất",
      excerpt:
        "Quy định mới về việc bán điện mặt trời áp mái cho lưới điện quốc gia với tỷ lệ tối đa 20% công suất lắp đặt.",
      author: "Administrator",
      date: "2024-01-15",
      image: "/images/news-1.jpg",
      category: "Chính sách",
      readTime: "5 phút đọc",
    },
    {
      id: 2,
      title: "Giá điện sinh hoạt tăng thêm 4,8% từ ngày hôm nay",
      excerpt:
        "EVN thông báo điều chỉnh tăng giá điện sinh hoạt bậc 3 trở lên nhằm khuyến khích tiết kiệm điện.",
      author: "Administrator",
      date: "2024-01-10",
      image: "/images/news-2.jpg",
      category: "Tin tức",
      readTime: "3 phút đọc",
    },
    {
      id: 3,
      title: "Điện mặt trời thừa có thể bù trừ cho EVN",
      excerpt:
        "Cơ chế bù trừ điện năng mới cho phép hộ gia đình có thể bán điện thизлишкиếm từ hệ thống solar về lưới.",
      author: "Administrator",
      date: "2024-01-08",
      image: "/images/news-3.jpg",
      category: "Công nghệ",
      readTime: "7 phút đọc",
    },
    {
      id: 4,
      title: 'Năng lượng mặt trời - Giải pháp "chống sốc" cho điện lưới',
      excerpt:
        "Hệ thống năng lượng mặt trời giúp giảm tải cho lưới điện quốc gia trong những giờ cao điểm.",
      author: "Administrator",
      date: "2024-01-05",
      image: "/images/news-4.jpg",
      category: "Phân tích",
      readTime: "6 phút đọc",
    },
    {
      id: 5,
      title: "Nhà máy điện mặt trời lớn nhất thế giới",
      excerpt:
        "Cập nhật về dự án nhà máy điện mặt trời có công suất lớn nhất thế giới và tác động đến ngành năng lượng.",
      author: "Administrator",
      date: "2024-01-03",
      image: "/images/news-5.jpg",
      category: "Quốc tế",
      readTime: "8 phút đọc",
    },
    {
      id: 6,
      title: "Top 10 thương hiệu năng lượng mặt trời hàng đầu thế giới",
      excerpt:
        "Danh sách các thương hiệu dẫn đầu về công nghệ và chất lượng trong ngành năng lượng mặt trời.",
      author: "Web Số",
      date: "2024-01-01",
      image: "/images/news-6.jpg",
      category: "Tổng hợp",
      readTime: "10 phút đọc",
    },
  ];

  const [featuredImageError, setFeaturedImageError] = useState(false);

  const mobileNewsInitial = 4; // Show 2x2 news initially on mobile (excluding featured)

  // Get news articles to display (excluding the first featured article)
  const getNewsToShow = () => {
    const remainingNews = newsArticles.slice(1); // Remove featured article
    if (isMobile) {
      return showAllMobile
        ? remainingNews
        : remainingNews.slice(0, mobileNewsInitial);
    }
    return remainingNews;
  };

  const hasMoreNews =
    isMobile &&
    !showAllMobile &&
    newsArticles.slice(1).length > mobileNewsInitial;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tin tức{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
              Năng lượng
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính
            sách, công nghệ và xu hướng phát triển
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-solar-blue to-primary-600 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Nổi bật
                  </span>
                  <span className="text-white/80 text-sm">
                    {newsArticles[0].readTime}
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {newsArticles[0].title}
                </h3>
                <p className="text-white/90 mb-6 text-lg">
                  {newsArticles[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">
                        {newsArticles[0].author}
                      </div>
                      <div className="text-white/70 text-sm">
                        {newsArticles[0].date}
                      </div>
                    </div>
                  </div>
                  <Link href={`/news/${newsArticles[0].id}`}>
                    <button className="bg-white text-solar-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      Đọc ngay
                    </button>
                  </Link>
                </div>
              </div>
              <div className="relative h-64 lg:h-auto bg-white/10 overflow-hidden">
                {!featuredImageError ? (
                  <Image
                    src={newsArticles[0].image}
                    alt={newsArticles[0].title}
                    fill
                    className="object-cover"
                    onError={() => setFeaturedImageError(true)}
                  />
                ) : (
                  /* Fallback placeholder */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white/50">
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
                      <span>Hình bài viết nổi bật</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {getNewsToShow().map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>

        {/* Mobile "Xem thêm" button */}
        {hasMoreNews && (
          <div className="flex justify-end mt-6 md:hidden">
            <Link href="/news">
              <span className="text-blue-600 hover:text-blue-700 transition-colors duration-200 text-sm font-medium cursor-pointer">
                Xem thêm &gt;
              </span>
            </Link>
          </div>
        )}

        {/* Desktop Load More Button - hidden on mobile when showing limited items */}
        {!isMobile && (
          <div className="text-center mt-12">
            <Link href="/news">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-4 rounded-lg font-semibold transition-colors">
                Xem thêm tin tức
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
