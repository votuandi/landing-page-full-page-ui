"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  MapPinIcon,
  BoltIcon,
  BuildingOfficeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import ScrollAnimationWrapper from "@/components/ScrollAnimationWrapper";

interface Project {
  id: number;
  title: string;
  location: string;
  capacity: string;
  completedDate: string;
  completedYear: number;
  completedMonth: number;
  image: string;
  description: string;
  category: string;
  client: string;
  investment: string;
  duration: string;
  features: string[];
}

export default function CompletedProjectsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "capacity">("date");

  const projectsPerPage = 6;

  // Extended projects data
  const allProjects: Project[] = [
    {
      id: 1,
      title: "Hệ thống điện mặt trời nhà máy ABC",
      location: "Bình Dương",
      capacity: "500kW",
      completedDate: "Tháng 12, 2023",
      completedYear: 2023,
      completedMonth: 12,
      image: "/images/news-1.jpg",
      description:
        "Hệ thống điện mặt trời quy mô lớn cho nhà máy sản xuất, giúp tiết kiệm 70% chi phí điện năng hàng năm.",
      category: "Công nghiệp",
      client: "Công ty ABC Manufacturing",
      investment: "8.5 tỷ VNĐ",
      duration: "3 tháng",
      features: ["Hệ thống monitoring", "Bảo trì tự động", "Kết nối EVN"],
    },
    {
      id: 2,
      title: "Điện mặt trời áp mái biệt thự",
      location: "TP. Hồ Chí Minh",
      capacity: "15kW",
      completedDate: "Tháng 11, 2023",
      completedYear: 2023,
      completedMonth: 11,
      image: "/images/news-2.jpg",
      description:
        "Hệ thống điện mặt trời áp mái cho biệt thự, tích hợp pin lưu trữ và hệ thống smart home.",
      category: "Dân dụng",
      client: "Gia đình Nguyễn Văn A",
      investment: "250 triệu VNĐ",
      duration: "1 tuần",
      features: ["Pin lưu trữ", "Smart home", "App điều khiển"],
    },
    {
      id: 3,
      title: "Trung tâm thương mại Solar Plaza",
      location: "Đồng Nai",
      capacity: "300kW",
      completedDate: "Tháng 10, 2023",
      completedYear: 2023,
      completedMonth: 10,
      image: "/images/news-3.jpg",
      description:
        "Dự án điện mặt trời cho trung tâm thương mại, cung cấp năng lượng sạch cho toàn bộ hệ thống.",
      category: "Thương mại",
      client: "Solar Plaza JSC",
      investment: "5.2 tỷ VNĐ",
      duration: "2 tháng",
      features: ["Hệ thống tự động", "Giám sát 24/7", "Backup điện"],
    },
    {
      id: 4,
      title: "Khu công nghiệp Việt Phú",
      location: "Bình Phước",
      capacity: "1.2MW",
      completedDate: "Tháng 9, 2023",
      completedYear: 2023,
      completedMonth: 9,
      image: "/images/news-4.jpg",
      description:
        "Hệ thống điện mặt trời lớn nhất khu vực với công nghệ tiên tiến, giảm 80% phát thải carbon.",
      category: "Công nghiệp",
      client: "Khu công nghiệp Việt Phú",
      investment: "18 tỷ VNĐ",
      duration: "6 tháng",
      features: ["Công nghệ AI", "Bảo trì dự báo", "Hệ thống tự làm sạch"],
    },
    {
      id: 5,
      title: "Trường học xanh Nguyễn Du",
      location: "Long An",
      capacity: "50kW",
      completedDate: "Tháng 8, 2023",
      completedYear: 2023,
      completedMonth: 8,
      image: "/images/news-5.jpg",
      description:
        "Dự án điện mặt trời cho trường học, góp phần giáo dục ý thức bảo vệ môi trường cho học sinh.",
      category: "Giáo dục",
      client: "Trường THPT Nguyễn Du",
      investment: "850 triệu VNĐ",
      duration: "1 tháng",
      features: ["Màn hình hiển thị", "Hệ thống giáo dục", "An toàn tuyệt đối"],
    },
    {
      id: 6,
      title: "Resort biển Mũi Né",
      location: "Phan Thiết",
      capacity: "100kW",
      completedDate: "Tháng 7, 2023",
      completedYear: 2023,
      completedMonth: 7,
      image: "/images/news-6.jpg",
      description:
        "Hệ thống điện mặt trời cho resort, kết hợp với hệ thống làm nóng nước năng lượng mặt trời.",
      category: "Du lịch",
      client: "Mũi Né Beach Resort",
      investment: "1.8 tỷ VNĐ",
      duration: "2 tháng",
      features: ["Nước nóng solar", "Hệ thống hồ bơi", "Chiếu sáng sân vườn"],
    },
    {
      id: 7,
      title: "Nhà máy dệt may Tân Tiến",
      location: "Đồng Nai",
      capacity: "800kW",
      completedDate: "Tháng 6, 2023",
      completedYear: 2023,
      completedMonth: 6,
      image: "/images/product-1.jpg",
      description:
        "Hệ thống năng lượng mặt trời cho nhà máy dệt may, giảm thiểu chi phí sản xuất và tác động môi trường.",
      category: "Công nghiệp",
      client: "Công ty Dệt may Tân Tiến",
      investment: "12 tỷ VNĐ",
      duration: "4 tháng",
      features: ["Hệ thống làm mát", "Tiết kiệm 60% điện", "Chứng chỉ xanh"],
    },
    {
      id: 8,
      title: "Khu dân cư Vinhomes Central",
      location: "TP. Hồ Chí Minh",
      capacity: "200kW",
      completedDate: "Tháng 5, 2023",
      completedYear: 2023,
      completedMonth: 5,
      image: "/images/product-2.jpg",
      description:
        "Dự án năng lượng mặt trời cho khu dân cư cao cấp, cung cấp điện cho khu vực công cộng.",
      category: "Dân dụng",
      client: "Vingroup",
      investment: "3.5 tỷ VNĐ",
      duration: "2 tháng",
      features: ["Chiếu sáng công cộng", "Sạc xe điện", "Hệ thống tưới"],
    },
    {
      id: 9,
      title: "Bệnh viện Đa khoa Quốc tế",
      location: "Cần Thơ",
      capacity: "350kW",
      completedDate: "Tháng 4, 2023",
      completedYear: 2023,
      completedMonth: 4,
      image: "/images/product-3.jpg",
      description:
        "Hệ thống điện mặt trời cho bệnh viện, đảm bảo nguồn điện ổn định cho các thiết bị y tế.",
      category: "Y tế",
      client: "Bệnh viện Đa khoa Quốc tế",
      investment: "6.2 tỷ VNĐ",
      duration: "3 tháng",
      features: ["UPS tích hợp", "Hệ thống dự phòng", "Giám sát y tế"],
    },
    {
      id: 10,
      title: "Siêu thị Co.opMart",
      location: "Hà Nội",
      capacity: "180kW",
      completedDate: "Tháng 3, 2023",
      completedYear: 2023,
      completedMonth: 3,
      image: "/images/product-4.jpg",
      description:
        "Lắp đặt hệ thống năng lượng mặt trời cho chuỗi siêu thị, tiết kiệm chi phí vận hành.",
      category: "Thương mại",
      client: "Saigon Co.op",
      investment: "3.1 tỷ VNĐ",
      duration: "1.5 tháng",
      features: ["Hệ thống làm lạnh", "Chiếu sáng LED", "Quản lý thông minh"],
    },
    {
      id: 11,
      title: "Nhà máy sản xuất Phúc Hưng",
      location: "Bà Rịa - Vũng Tàu",
      capacity: "600kW",
      completedDate: "Tháng 2, 2023",
      completedYear: 2023,
      completedMonth: 2,
      image: "/images/solar-battery-hero.jpg",
      description:
        "Hệ thống năng lượng mặt trời cho nhà máy sản xuất thực phẩm, đảm bảo an toàn thực phẩm.",
      category: "Công nghiệp",
      client: "Công ty Phúc Hưng",
      investment: "9.8 tỷ VNĐ",
      duration: "3.5 tháng",
      features: [
        "Hệ thống làm lạnh",
        "Kiểm soát nhiệt độ",
        "Truy xuất nguồn gốc",
      ],
    },
    {
      id: 12,
      title: "Trang trại thông minh EcoFarm",
      location: "Tiền Giang",
      capacity: "75kW",
      completedDate: "Tháng 1, 2023",
      completedYear: 2023,
      completedMonth: 1,
      image: "/images/solar-inverter-hero.jpg",
      description:
        "Ứng dụng năng lượng mặt trời cho nông nghiệp thông minh, tưới tiêu tự động.",
      category: "Nông nghiệp",
      client: "HTX EcoFarm",
      investment: "1.2 tỷ VNĐ",
      duration: "1 tháng",
      features: ["Tưới tiêu tự động", "Cảm biến đất", "IoT nông nghiệp"],
    },
  ];

  // Get unique years and categories for filtering
  const availableYears = [
    ...new Set(allProjects.map((p) => p.completedYear)),
  ].sort((a, b) => b - a);
  const availableCategories = [...new Set(allProjects.map((p) => p.category))];

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = allProjects;

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(
        (project) => project.completedYear === selectedYear
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (project) => project.category === selectedCategory
      );
    }

    // Sort projects
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return b.completedYear !== a.completedYear
          ? b.completedYear - a.completedYear
          : b.completedMonth - a.completedMonth;
      } else {
        return parseInt(b.capacity) - parseInt(a.capacity);
      }
    });
  }, [allProjects, selectedYear, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const currentProjects = filteredProjects.slice(
    startIndex,
    startIndex + projectsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedCategory, sortBy]);

  const getCategoryColor = (category: string) => {
    const colors = {
      "Công nghiệp": "bg-blue-100 text-blue-800",
      "Dân dụng": "bg-green-100 text-green-800",
      "Thương mại": "bg-orange-100 text-orange-800",
      "Giáo dục": "bg-purple-100 text-purple-800",
      "Du lịch": "bg-pink-100 text-pink-800",
      "Y tế": "bg-red-100 text-red-800",
      "Nông nghiệp": "bg-yellow-100 text-yellow-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Các dự án{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
                đã hoàn thành
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Khám phá hơn 1000 dự án tiêu biểu mà chúng tôi đã triển khai thành
              công trên khắp các tỉnh thành, mang lại giá trị bền vững cho khách
              hàng.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Statistics */}
        <ScrollAnimationWrapper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-blue">
                {allProjects.length}+
              </div>
              <div className="text-gray-600">Dự án hoàn thành</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-orange">50MW+</div>
              <div className="text-gray-600">Tổng công suất</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-green">
                {availableCategories.length}
              </div>
              <div className="text-gray-600">Lĩnh vực</div>
            </div>
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-yellow">100%</div>
              <div className="text-gray-600">Thành công</div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Filters */}
        <ScrollAnimationWrapper>
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2" />
                Bộ lọc dự án
              </h3>
              <div className="text-sm text-gray-600">
                {filteredProjects.length} dự án được tìm thấy
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm hoàn thành
                </label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) =>
                    setSelectedYear(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-solar-blue focus:border-transparent"
                >
                  <option value="">Tất cả năm</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lĩnh vực
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-solar-blue focus:border-transparent"
                >
                  <option value="all">Tất cả lĩnh vực</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "capacity")
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-solar-blue focus:border-transparent"
                >
                  <option value="date">Ngày hoàn thành</option>
                  <option value="capacity">Công suất</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setSelectedCategory("all");
                    setSortBy("date");
                  }}
                  className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Projects Grid */}
        <ScrollAnimationWrapper>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {currentProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                {/* Project Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                        project.category
                      )}`}
                    >
                      {project.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-solar-blue">
                      {project.capacity}
                    </span>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {project.location}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {project.completedDate}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-solar-blue transition-colors line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <BoltIcon className="w-4 h-4 mr-1" />
                        <span>Công suất: {project.capacity}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                        <span>{project.duration}</span>
                      </div>
                    </div>
                    <div className="text-sm text-solar-blue font-semibold">
                      Giá trị: {project.investment}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Khách hàng:</span>
                        <br />
                        <span className="line-clamp-1">{project.client}</span>
                      </div>
                      <button className="text-solar-blue hover:text-solar-blue/80 font-medium text-sm flex items-center space-x-1 group/btn">
                        <span>Chi tiết</span>
                        <ChevronRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Pagination */}
        {totalPages > 1 && (
          <ScrollAnimationWrapper>
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ChevronLeftIcon className="w-6 h-6 text-gray-600 group-hover:text-solar-blue" />
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }).map(
                  (_, index) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-12 h-12 rounded-full font-medium transition-all duration-300 ${
                          pageNum === currentPage
                            ? "bg-solar-blue text-white scale-110"
                            : "bg-white text-gray-600 hover:bg-gray-100 shadow-lg"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-solar-blue" />
              </button>
            </div>

            <div className="text-center mt-6 text-gray-600">
              Trang {currentPage} / {totalPages} - Hiển thị {startIndex + 1}-
              {Math.min(startIndex + projectsPerPage, filteredProjects.length)}{" "}
              trong tổng số {filteredProjects.length} dự án
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* No Results */}
        {filteredProjects.length === 0 && (
          <ScrollAnimationWrapper>
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Không tìm thấy dự án nào
              </h3>
              <p className="text-gray-600 mb-6">
                Thử thay đổi bộ lọc để xem thêm dự án khác
              </p>
              <button
                onClick={() => {
                  setSelectedYear(null);
                  setSelectedCategory("all");
                  setSortBy("date");
                }}
                className="px-6 py-3 bg-solar-blue text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Call to Action */}
        <ScrollAnimationWrapper>
          <div className="text-center mt-20">
            <div className="bg-gradient-to-r from-solar-blue to-primary-600 rounded-3xl p-12 text-white">
              <h3 className="text-3xl font-bold mb-6">
                Bạn muốn tham khảo dự án cụ thể?
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Liên hệ với chúng tôi để được tư vấn chi tiết về các dự án tương
                tự và nhận báo giá miễn phí cho dự án của bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-solar-blue font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                  Tư vấn miễn phí
                </button>
                <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-solar-blue transition-all duration-300">
                  Tải catalogue
                </button>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
