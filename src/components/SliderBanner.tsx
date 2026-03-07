"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  backgroundColor: string;
}

export default function SliderBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering client-specific content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch banners from API
  useEffect(() => {
    if (!mounted) return;

    const fetchBanners = async () => {
      try {
        const response = await fetch("/api/banners?isActive=true&orderBy=order");
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = "Failed to fetch banners";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("API Error:", errorData);
          } catch (e) {
            console.error("Response status:", response.status, response.statusText);
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        // Map API response to Slide format
        const mappedSlides: Slide[] = data.map((banner: any) => ({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle || "",
          description: banner.description || "",
          buttonText: banner.buttonText || "",
          buttonLink: banner.buttonLink || "",
          backgroundImage: banner.backgroundImage
            ? `url('${banner.backgroundImage}')`
            : "",
          backgroundColor: banner.backgroundColor || "bg-gradient-to-r from-blue-600 to-purple-600",
        }));
        setSlides(mappedSlides);
      } catch (err) {
        console.error("Error fetching banners:", err);
        // Log more details about the error
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        // Fallback to empty array if API fails
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [mounted]);

  // Auto slide functionality
  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Don't render if not mounted or loading or no slides
  if (!mounted || loading) {
    return (
      <section className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Đang tải...</div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Chưa có banner nào</div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="min-w-full h-full relative flex items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: slide.backgroundImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50"></div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center text-white">
                <div className="mb-4">
                  <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                    {slide.title}
                  </span>
                </div>

                <h1 className="slider-title text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  {slide.subtitle}
                </h1>

                <p className="slider-subtitle text-xl md:text-2xl mb-8 leading-relaxed max-w-3xl mx-auto opacity-90">
                  {slide.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={slide.buttonLink}
                    className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 inline-block"
                  >
                    {slide.buttonText}
                  </Link>
                  <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300">
                    Gọi ngay: 0909019234
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-32 h-32 border border-white/20 rounded-full hidden lg:block"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 border border-white/20 rounded-full hidden lg:block"></div>
            <div className="absolute top-1/2 left-20 w-16 h-16 border border-white/30 rounded-full hidden lg:block transform -translate-y-1/2"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-20 hidden md:block"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6"
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
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-20 hidden md:block"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6"
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

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/75"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>

      {/* Mobile Swipe Indicators */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white/60 text-sm hidden max-md:block">
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          <span>Vuốt để xem thêm</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
