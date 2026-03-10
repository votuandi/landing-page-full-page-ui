"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
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
import Link from "next/link";

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

interface ApiProject {
  id: number;
  title: string;
  location: string | null;
  capacity: string | null;
  completedDate: string | null;
  imageUrl: string | null;
  description: string | null;
  category: string;
  client: string | null;
  isDisplay: boolean;
  showInHomepage: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function CompletedProjectsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "capacity">("date");
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectsPerPage = 6;

  // Parse completedDate to extract year and month
  const parseCompletedDate = (dateString: string | null): { year: number; month: number; formatted: string } => {
    if (!dateString) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        formatted: `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`,
      };
    }

    // Try to parse various date formats
    // Format 1: "Tháng 12, 2023"
    const monthYearMatch = dateString.match(/Tháng\s+(\d+),\s*(\d+)/i);
    if (monthYearMatch) {
      const month = parseInt(monthYearMatch[1]);
      const year = parseInt(monthYearMatch[2]);
      return { year, month, formatted: dateString };
    }

    // Format 2: ISO date string "2023-12-01"
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      const year = isoDate.getFullYear();
      const month = isoDate.getMonth() + 1;
      const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];
      return {
        year,
        month,
        formatted: `${monthNames[month - 1]}, ${year}`,
      };
    }

    // Format 3: "12/2023" or "12-2023"
    const slashMatch = dateString.match(/(\d+)[\/\-](\d+)/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1]);
      const year = parseInt(slashMatch[2]);
      const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];
      return {
        year,
        month,
        formatted: `${monthNames[month - 1]}, ${year}`,
      };
    }

    // Default to current date if parsing fails
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      formatted: `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`,
    };
  };

  // Transform API project to component project
  const transformProject = useCallback((apiProject: ApiProject): Project => {
    const dateInfo = parseCompletedDate(apiProject.completedDate);

    return {
      id: apiProject.id,
      title: apiProject.title,
      location: apiProject.location || "Chưa xác định",
      capacity: apiProject.capacity || "N/A",
      completedDate: dateInfo.formatted,
      completedYear: dateInfo.year,
      completedMonth: dateInfo.month,
      image: apiProject.imageUrl || "/images/placeholder.jpg",
      description: apiProject.description || "Không có mô tả",
      category: apiProject.category || "Công nghiệp",
      client: apiProject.client || "Khách hàng",
      investment: "Liên hệ", // Not in database, using default
      duration: "Liên hệ", // Not in database, using default
      features: [], // Not in database, using empty array
    };
  }, []);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/projects?isDisplay=true&limit=100&orderBy=completedDate&order=desc');

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const result = await response.json();
        const projects = (result.data || []).map(transformProject);
        setAllProjects(projects);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [transformProject]);


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

    // Helper function to parse capacity to numeric value (in kW)
    const parseCapacity = (capacity: string): number => {
      if (!capacity || capacity === "N/A") return 0;
      const match = capacity.match(/([\d.]+)\s*(kW|MW|W)/i);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === "MW") return value * 1000; // Convert MW to kW
      if (unit === "W") return value / 1000; // Convert W to kW
      return value; // Already in kW
    };

    // Sort projects
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return b.completedYear !== a.completedYear
          ? b.completedYear - a.completedYear
          : b.completedMonth - a.completedMonth;
      } else {
        return parseCapacity(b.capacity) - parseCapacity(a.capacity);
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
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-blue">
                {allProjects.length}+
              </div>
              <div className="text-gray-600">Dự án hoàn thành</div>
            </div>
            {/* <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-solar-orange">50MW+</div>
              <div className="text-gray-600">Tổng công suất</div>
            </div> */}
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
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solar-blue"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">Không thể tải dự án: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-solar-blue text-white rounded-lg hover:bg-solar-blue/90 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {currentProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Project Image */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
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
          )}
        </ScrollAnimationWrapper>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
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
                        className={`w-12 h-12 rounded-full font-medium transition-all duration-300 ${pageNum === currentPage
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
        {!loading && !error && filteredProjects.length === 0 && (
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
                <Link href="/contact-us">
                  <button className="px-8 py-4 bg-white text-solar-blue font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                    Tư vấn miễn phí
                  </button>
                </Link>
                {/* <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-solar-blue transition-all duration-300">
                  Tải catalogue
                </button> */}
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
