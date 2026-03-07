"use client";

import { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface ContactForm {
  id: number;
  name: string;
  phone: string;
  email: string;
  consultationType: string;
  specificItem: string | null;
  details: string | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResolved, setFilterResolved] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Fetch contact forms
  const fetchContactForms = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (filterResolved !== "all") {
        params.append("isResolved", filterResolved);
      }

      const response = await fetch(`/api/contact-form?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch contact forms");
      }

      const data = await response.json();
      setContactForms(data.contactForms);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching contact forms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactForms(1);
  }, [searchQuery, filterResolved]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchContactForms(newPage);
    }
  };

  // Toggle resolved status
  const toggleResolvedStatus = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/contact-form/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isResolved: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update contact form");
      }

      // Refresh the list
      await fetchContactForms(pagination.currentPage);
    } catch (error) {
      console.error("Error updating contact form:", error);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý khách hàng liên hệ
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Xem và quản lý các yêu cầu tư vấn từ khách hàng
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter by resolved status */}
            <div>
              <select
                value={filterResolved}
                onChange={(e) => setFilterResolved(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="false">Chưa liên hệ</option>
                <option value="true">Đã liên hệ</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Tổng số: <strong>{pagination.total}</strong> yêu cầu
            </span>
            <span>
              Trang {pagination.currentPage} / {pagination.totalPages}
            </span>
          </div>
        </div>

        {/* Contact Forms List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : contactForms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">Không tìm thấy yêu cầu nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contactForms.map((form) => (
              <div
                key={form.id}
                className={`rounded-lg shadow p-6 ${
                  form.isResolved ? "bg-gray-50" : "bg-red-50"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {form.name}
                      </h3>
                      {form.isResolved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Đã liên hệ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Chưa liên hệ
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <PhoneIcon className="w-4 h-4 text-gray-500" />
                        <a
                          href={`tel:${form.phone}`}
                          className="hover:text-primary-600"
                        >
                          {form.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                        <a
                          href={`mailto:${form.email}`}
                          className="hover:text-primary-600"
                        >
                          {form.email}
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Loại tư vấn:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {form.consultationType}
                        </span>
                      </div>
                      {form.specificItem && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Sản phẩm/Dịch vụ:
                          </span>
                          <span className="ml-2 text-gray-600">
                            {form.specificItem}
                          </span>
                        </div>
                      )}
                    </div>

                    {form.details && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-gray-700">
                          Chi tiết:
                        </span>
                        <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                          {form.details}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      <span>Gửi lúc: {formatDate(form.createdAt)}</span>
                      {form.updatedAt !== form.createdAt && (
                        <span className="ml-4">
                          Cập nhật: {formatDate(form.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() =>
                        toggleResolvedStatus(form.id, form.isResolved)
                      }
                      disabled={updatingId === form.id}
                      className={`px-6 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        form.isResolved
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {updatingId === form.id ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang xử lý...
                        </span>
                      ) : form.isResolved ? (
                        "Xác nhận chưa liên hệ"
                      ) : (
                        "Xác nhận đã liên hệ"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Trước
            </button>

            {/* Page Numbers */}
            {Array.from(
              { length: Math.min(pagination.totalPages, 7) },
              (_, index) => {
                let pageNumber;
                if (pagination.totalPages <= 7) {
                  pageNumber = index + 1;
                } else if (pagination.currentPage <= 4) {
                  pageNumber = index + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 3) {
                  pageNumber = pagination.totalPages - 6 + index;
                } else {
                  pageNumber = pagination.currentPage - 3 + index;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      pagination.currentPage === pageNumber
                        ? "text-blue-600 bg-blue-50 border border-blue-300"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
