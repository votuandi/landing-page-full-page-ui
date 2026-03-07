"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface Project {
  id: number;
  title: string;
  location: string | null;
  capacity: string | null;
  completedDate: string | null;
  imageUrl: string | null;
  description: string | null;
  category: string;
  client: string | null;
  detail: string | null;
}

export default function ProjectsPageContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["Tất cả"]);

  const projectsPerPage = 9;

  // Fetch projects data from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects?limit=100&isDisplay=true&orderBy=completedDate&order=desc');
        if (response.ok) {
          const result = await response.json();
          setAllProjects(result.data || []);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(result.data.map((project: Project) => project.category))) as string[];
          setCategories(["Tất cả", ...uniqueCategories]);
        } else {
          console.error('Failed to fetch projects');
          setAllProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on category and search
  const filteredProjects = useMemo(() => {
    let filtered = allProjects;

    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter(
        (project) => project.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.client?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, allProjects]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const paginatedProjects = filteredProjects.slice(
    startIndex,
    startIndex + projectsPerPage
  );

  // Reset to first page when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

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

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Dự án{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
              Hoàn thành
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá những dự án năng lượng mặt trời tiêu biểu mà chúng tôi đã triển khai thành công
          </p>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solar-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Dự án{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
            Hoàn thành
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Khám phá những dự án năng lượng mặt trời tiêu biểu mà chúng tôi đã triển khai thành công
        </p>
        
        {/* Statistics */}
        <div className="flex justify-center items-center mt-8 space-x-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-solar-blue">{allProjects.length}+</div>
            <div className="text-gray-600">Dự án hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-solar-orange">50MW+</div>
            <div className="text-gray-600">Tổng công suất</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-solar-green">98%</div>
            <div className="text-gray-600">Khách hàng hài lòng</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-solar-blue focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white ring-2 ring-primary-300 shadow-lg"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 border border-gray-200 hover:border-primary-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {paginatedProjects.length} trên {filteredProjects.length} dự án
        </div>
      </div>

      {/* Projects Grid */}
      {paginatedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {paginatedProjects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer">
                {/* Project Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={project.imageUrl || '/images/placeholder.jpg'}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                        project.category
                      )}`}
                    >
                      {project.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-solar-blue font-medium">
                      {project.location || 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {project.completedDate || 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-solar-blue transition-colors line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {project.description || 'Không có mô tả'}
                  </p>

                  {project.client && (
                    <div className="mb-4 text-sm text-gray-500">
                      <span className="font-medium">Khách hàng:</span> {project.client}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Công suất
                        </div>
                        <div className="font-semibold text-solar-orange">
                          {project.capacity || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <button className="text-solar-blue hover:text-solar-blue/80 font-medium text-sm flex items-center space-x-1 group/btn">
                      <span>Chi tiết</span>
                      <ChevronRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy dự án
          </h3>
          <p className="text-gray-500">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc khác
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center space-y-4">
          {/* Page Numbers */}
          <div className="flex space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNumber
                      ? "bg-solar-blue text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>

          {/* Page Info */}
          <div className="text-sm text-gray-600">
            Trang {currentPage} trên {totalPages}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-16">
        <div className="bg-gradient-to-br from-solar-blue to-primary-600 rounded-2xl p-8 shadow-lg text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Bạn có dự án cần triển khai?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Với kinh nghiệm hơn 10 năm và đội ngũ kỹ thuật chuyên nghiệp,
            chúng tôi cam kết mang đến giải pháp năng lượng mặt trời tối ưu
            cho dự án của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact-us">
              <button className="px-8 py-3 bg-white text-solar-blue font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                Tư vấn miễn phí
              </button>
            </Link>
            <Link href="/about-us">
              <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-solar-blue transition-all duration-300">
                Về chúng tôi
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
