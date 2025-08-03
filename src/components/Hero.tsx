import Image from "next/image";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 py-16 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-pulse"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <ScrollAnimationWrapper
              animation="fall-down"
              delay={200}
              duration={800}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Giải pháp{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600 animate-gradient-x">
                  Năng lượng Mặt trời
                </span>{" "}
                hàng đầu
              </h1>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper
              animation="fall-down"
              delay={400}
              duration={800}
            >
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao.
                Tấm pin solar, biến tần inverter, pin lưu trữ và giải pháp năng
                lượng tái tạo toàn diện.
              </p>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper
              animation="drop-in"
              delay={600}
              duration={900}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-solar-blue hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 solar-hover hover:scale-105 transform group relative overflow-hidden">
                  <span className="relative z-10">Tư vấn miễn phí</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </button>
                <button className="border-2 border-solar-blue text-solar-blue hover:bg-solar-blue hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 transform group relative overflow-hidden">
                  <span className="relative z-10">Xem sản phẩm</span>
                  <div className="absolute inset-0 bg-solar-blue transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </button>
              </div>
            </ScrollAnimationWrapper>

            {/* Features */}
            <StaggeredScrollAnimation
              animation="fall-down"
              staggerDelay={150}
              className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12"
            >
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-solar-blue mb-2">
                  10+
                </div>
                <div className="text-gray-600">Năm kinh nghiệm</div>
              </div>
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-solar-blue mb-2">
                  1000+
                </div>
                <div className="text-gray-600">Dự án hoàn thành</div>
              </div>
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-solar-blue mb-2">
                  24/7
                </div>
                <div className="text-gray-600">Hỗ trợ kỹ thuật</div>
              </div>
            </StaggeredScrollAnimation>
          </div>

          {/* Right Content - Hero Video */}
          <div className="relative">
            <ScrollAnimationWrapper
              animation="zoom-in"
              delay={300}
              duration={1000}
            >
              <div className="relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="aspect-video relative rounded-xl overflow-hidden group">
                    {/* Background Video */}
                    <video
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src="/videos/hero_video.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Overlay Content */}
                    <div className="relative z-10 h-full flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-500">
                      <div className="text-center text-white transform group-hover:scale-105 transition-transform duration-500">
                        <svg
                          className="w-24 h-24 mx-auto mb-4 animate-spin-slow"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <h3 className="text-xl font-semibold animate-fade-in-up delay-600">
                          Hệ thống Solar
                        </h3>
                        <p className="text-sm opacity-90 animate-fade-in-up delay-700">
                          Tiết kiệm 70% điện năng
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>

            {/* Floating Cards */}
            <ScrollAnimationWrapper
              animation="drop-in"
              delay={800}
              duration={600}
            >
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 solar-hover cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-solar-green rounded-full flex items-center justify-center group-hover:animate-bounce">
                    <svg
                      className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110"
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
                  <div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-solar-green transition-colors duration-300">
                      Tiết kiệm điện
                    </div>
                    <div className="text-sm text-gray-600">Lên đến 90%</div>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper
              animation="drop-in"
              delay={1000}
              duration={600}
            >
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 solar-hover cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center group-hover:animate-pulse">
                    <svg
                      className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-500 transition-colors duration-300">
                      Thân thiện
                    </div>
                    <div className="text-sm text-gray-600">
                      Thân thiện môi trường
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 animate-wave">
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-12 fill-white transition-all duration-1000"
        >
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </section>
  );
}
