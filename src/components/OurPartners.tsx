"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const partners = [
  {
    name: "An Khang Pharmacy",
    logo: "/images/partners/Logo-Nha-Thuoc-An-Khang-.webp",
  },
  {
    name: "The Gioi Di Dong",
    logo: "/images/partners/logo-the-gioi-di-dong-2.jpg",
  },
  {
    name: "Bach Hoa Xanh",
    logo: "/images/partners/logo-bach-hoa-xanh-compressed.jpg",
  },
  { name: "Partner 1", logo: "/images/partners/1-4748-hinh.png" },
  { name: "Partner 2", logo: "/images/partners/3-1114-hinh.jpg" },
  { name: "Partner 3", logo: "/images/partners/4-7734-hinh.png" },
  { name: "Partner 4", logo: "/images/partners/images.jpg" },
];

export default function OurPartners() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === partners.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToPrevious = () => {
    setCurrentIndex(
      currentIndex === 0 ? partners.length - 1 : currentIndex - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToNext = () => {
    setCurrentIndex(
      currentIndex === partners.length - 1 ? 0 : currentIndex + 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Đối Tác Của Chúng Tôi
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Chúng tôi tự hào hợp tác với những thương hiệu hàng đầu trong ngành
            năng lượng mặt trời
          </p>
        </div>

        {/* Partners Slider */}
        <div className="relative">
          {/* Slider Container */}
          <div className="overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {partners.map((partner, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center py-8">
                    {/* Show 6 partners per slide, cycling through the array */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const partnerIndex = (index * 6 + i) % partners.length;
                      const currentPartner = partners[partnerIndex];
                      return (
                        <div
                          key={`${index}-${i}`}
                          className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <Image
                            src={currentPartner.logo}
                            alt={currentPartner.name}
                            width={120}
                            height={60}
                            className="max-w-full h-auto object-contain transition-all duration-300 hover:scale-105"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 z-10"
            aria-label="Previous partners"
          >
            <svg
              className="w-6 h-6 text-gray-600"
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

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 z-10"
            aria-label="Next partners"
          >
            <svg
              className="w-6 h-6 text-gray-600"
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

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {partners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentIndex === index
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
