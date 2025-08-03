"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface Project {
  id: number;
  title: string;
  location: string;
  capacity: string;
  completedDate: string;
  image: string;
  description: string;
  category: string;
  client: string;
}

export default function ProjectsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const projects: Project[] = [
    {
      id: 1,
      title: "Hệ thống điện mặt trời nhà máy ABC",
      location: "Bình Dương",
      capacity: "500kW",
      completedDate: "Tháng 12, 2023",
      image: "/images/news-1.jpg",
      description:
        "Hệ thống điện mặt trời quy mô lớn cho nhà máy sản xuất, giúp tiết kiệm 70% chi phí điện năng hàng năm.",
      category: "Công nghiệp",
      client: "Công ty ABC Manufacturing",
    },
    {
      id: 2,
      title: "Điện mặt trời áp mái biệt thự",
      location: "TP. Hồ Chí Minh",
      capacity: "15kW",
      completedDate: "Tháng 11, 2023",
      image: "/images/news-2.jpg",
      description:
        "Hệ thống điện mặt trời áp mái cho biệt thự, tích hợp pin lưu trữ và hệ thống smart home.",
      category: "Dân dụng",
      client: "Gia đình Nguyễn Văn A",
    },
    {
      id: 3,
      title: "Trung tâm thương mại Solar Plaza",
      location: "Đồng Nai",
      capacity: "300kW",
      completedDate: "Tháng 10, 2023",
      image: "/images/news-3.jpg",
      description:
        "Dự án điện mặt trời cho trung tâm thương mại, cung cấp năng lượng sạch cho toàn bộ hệ thống.",
      category: "Thương mại",
      client: "Solar Plaza JSC",
    },
    {
      id: 4,
      title: "Khu công nghiệp Việt Phú",
      location: "Bình Phước",
      capacity: "1.2MW",
      completedDate: "Tháng 9, 2023",
      image: "/images/news-4.jpg",
      description:
        "Hệ thống điện mặt trời lớn nhất khu vực với công nghệ tiên tiến, giảm 80% phát thải carbon.",
      category: "Công nghiệp",
      client: "Khu công nghiệp Việt Phú",
    },
    {
      id: 5,
      title: "Trường học xanh Nguyễn Du",
      location: "Long An",
      capacity: "50kW",
      completedDate: "Tháng 8, 2023",
      image: "/images/news-5.jpg",
      description:
        "Dự án điện mặt trời cho trường học, góp phần giáo dục ý thức bảo vệ môi trường cho học sinh.",
      category: "Giáo dục",
      client: "Trường THPT Nguyễn Du",
    },
    {
      id: 6,
      title: "Resort biển Mũi Né",
      location: "Phan Thiết",
      capacity: "100kW",
      completedDate: "Tháng 7, 2023",
      image: "/images/news-6.jpg",
      description:
        "Hệ thống điện mặt trời cho resort, kết hợp với hệ thống làm nóng nước năng lượng mặt trời.",
      category: "Du lịch",
      client: "Mũi Né Beach Resort",
    },
  ];

  const itemsPerPage = 3;
  const mobileProjectsInitial = 4; // Show 2x2 projects initially on mobile
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages);
  };

  const getCurrentProjects = () => {
    if (isMobile) {
      return showAllMobile
        ? projects
        : projects.slice(0, mobileProjectsInitial);
    }
    const startIndex = currentIndex * itemsPerPage;
    return projects.slice(startIndex, startIndex + itemsPerPage);
  };

  const hasMoreProjects =
    isMobile && !showAllMobile && projects.length > mobileProjectsInitial;

  const getCategoryColor = (category: string) => {
    const colors = {
      "Công nghiệp": "bg-blue-100 text-blue-800",
      "Dân dụng": "bg-green-100 text-green-800",
      "Thương mại": "bg-orange-100 text-orange-800",
      "Giáo dục": "bg-purple-100 text-purple-800",
      "Du lịch": "bg-pink-100 text-pink-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Các dự án{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
              đã hoàn thành
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Khám phá những dự án tiêu biểu mà chúng tôi đã triển khai thành
            công, mang lại giá trị bền vững cho khách hàng và cộng đồng.
          </p>
          <div className="flex justify-center items-center mt-8 space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-solar-blue">1000+</div>
              <div className="text-gray-600">Dự án hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-solar-orange">50MW+</div>
              <div className="text-gray-600">Tổng công suất lắp đặt</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-solar-green">98%</div>
              <div className="text-gray-600">Khách hàng hài lòng</div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12">
            {getCurrentProjects().map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                {/* Project Image */}
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 md:top-4 md:left-4">
                    <span
                      className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${getCategoryColor(
                        project.category
                      )}`}
                    >
                      {project.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Project Content */}
                <div className="p-3 md:p-6">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <span className="text-xs md:text-sm text-solar-blue font-medium">
                      {project.location}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500">
                      {project.completedDate}
                    </span>
                  </div>

                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-solar-blue transition-colors line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-gray-600 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 text-xs md:text-base">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Công suất
                        </div>
                        <div className="font-semibold text-solar-orange text-sm md:text-base">
                          {project.capacity}
                        </div>
                      </div>
                    </div>
                    <button className="text-solar-blue hover:text-solar-blue/80 font-medium text-xs md:text-sm flex items-center space-x-1 group/btn">
                      <span>Chi tiết</span>
                      <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile "Xem thêm" button */}
          {hasMoreProjects && (
            <div className="flex justify-end mb-6 md:hidden">
              <button
                onClick={() => setShowAllMobile(true)}
                className="text-blue-600 hover:text-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                Xem thêm &gt;
              </button>
            </div>
          )}

          {/* Desktop Navigation Controls - hidden on mobile */}
          {!isMobile && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ChevronLeftIcon className="w-6 h-6 text-gray-600 group-hover:text-solar-blue" />
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-solar-blue scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={currentIndex === totalPages - 1}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-solar-blue" />
              </button>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Bạn có dự án cần triển khai?
            </h3>
            <p className="text-gray-600 mb-6">
              Với kinh nghiệm hơn 10 năm và đội ngũ kỹ thuật chuyên nghiệp,
              chúng tôi cam kết mang đến giải pháp năng lượng mặt trời tối ưu
              cho dự án của bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-gradient-to-r from-solar-blue to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                Tư vấn miễn phí
              </button>
              <button className="px-8 py-3 border-2 border-solar-blue text-solar-blue font-semibold rounded-xl hover:bg-solar-blue hover:text-white transition-all duration-300">
                Xem thêm dự án
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
