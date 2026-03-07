"use client";

import { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  setEditingOffice,
  addNewOffice,
  updateLocalOffice,
  removeNewOffice,
} from "@/lib/features/offices/officesSlice";

export default function OfficePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const dispatch = useAppDispatch();
  const {
    offices,
    loading,
    error,
    editingOfficeId,
    pagination,
  } = useAppSelector((state) => state.offices);

  // Fetch data on mount and page change
  useEffect(() => {
    dispatch(fetchOffices({
      page: currentPage,
      limit: 10,
      search: searchQuery || undefined,
    }));
  }, [dispatch, currentPage, searchQuery]);

  // Office handlers
  const handleAddOffice = () => {
    dispatch(addNewOffice());
  };

  const handleDeleteOffice = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) {
      return;
    }

    try {
      await dispatch(deleteOffice(id)).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa chi nhánh. Vui lòng thử lại.");
    }
  };

  const handleSaveOffice = async (id: number) => {
    const office = offices.find((o) => o.id === id);
    if (!office) return;

    // Validate required fields
    if (!office.name || !office.phone || !office.email || !office.address || !office.workingTime) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Số điện thoại, Email, Địa chỉ, Giờ làm việc)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(office.email)) {
      alert('Email không hợp lệ');
      return;
    }

    try {
      const isNewOffice = id === 0;

      if (isNewOffice) {
        await dispatch(
          createOffice({
            name: office.name,
            phone: office.phone,
            email: office.email,
            address: office.address,
            workingTime: office.workingTime,
            googleMapEmbedUrl: office.googleMapEmbedUrl,
            isMainOffice: office.isMainOffice,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateOffice({
            id,
            office: {
              name: office.name,
              phone: office.phone,
              email: office.email,
              address: office.address,
              workingTime: office.workingTime,
              googleMapEmbedUrl: office.googleMapEmbedUrl,
              isMainOffice: office.isMainOffice,
            },
          })
        ).unwrap();
      }

      alert('Lưu chi nhánh thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu chi nhánh. Vui lòng thử lại.");
    }
  };

  // Pagination component
  const Pagination = ({
    pagination,
    currentPage,
    onPageChange
  }: {
    pagination: any;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> đến{' '}
              <span className="font-medium">
                {Math.min(currentPage * pagination.limit, pagination.total)}
              </span>{' '}
              trong <span className="font-medium">{pagination.total}</span> kết quả
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Trước</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              {[...Array(pagination.totalPages)].map((_, idx) => {
                const page = idx + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                        ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span
                      key={page}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Sau</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chi nhánh</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý thông tin các chi nhánh của công ty
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Danh sách chi nhánh
          </h2>
          <button
            onClick={handleAddOffice}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Thêm Chi nhánh</span>
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm chi nhánh
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tìm theo tên, địa chỉ, số điện thoại, email..."
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {searchQuery && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Đang tải...
          </div>
        ) : offices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có chi nhánh nào. Nhấn &quot;Thêm Chi nhánh&quot; để tạo chi nhánh mới.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          {offices.map((office) => (
            <div
              key={office.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {editingOfficeId === office.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên chi nhánh *
                        </label>
                        <input
                          type="text"
                          value={office.name}
                          onChange={(e) =>
                            dispatch(
                              updateLocalOffice({
                                ...office,
                                name: e.target.value,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Tên chi nhánh"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại *
                        </label>
                        <input
                          type="text"
                          value={office.phone}
                          onChange={(e) =>
                            dispatch(
                              updateLocalOffice({
                                ...office,
                                phone: e.target.value,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Số điện thoại"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={office.email}
                          onChange={(e) =>
                            dispatch(
                              updateLocalOffice({
                                ...office,
                                email: e.target.value,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giờ làm việc *
                        </label>
                        <input
                          type="text"
                          value={office.workingTime}
                          onChange={(e) =>
                            dispatch(
                              updateLocalOffice({
                                ...office,
                                workingTime: e.target.value,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ví dụ: 8:00 - 17:00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ *
                      </label>
                      <textarea
                        value={office.address}
                        onChange={(e) =>
                          dispatch(
                            updateLocalOffice({
                              ...office,
                              address: e.target.value,
                            })
                          )
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Địa chỉ chi nhánh"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đường dẫn Google Map
                      </label>
                      <input
                        type="text"
                        value={office.googleMapEmbedUrl || ''}
                        onChange={(e) =>
                          dispatch(
                            updateLocalOffice({
                              ...office,
                              googleMapEmbedUrl: e.target.value,
                            })
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://www.google.com/maps/embed?pb=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL nhúng Google Maps (embed URL)
                      </p>
                    </div>
                    <div className="flex items-center border-t pt-4">
                      <input
                        type="checkbox"
                        id={`main-${office.id}`}
                        checked={office.isMainOffice}
                        onChange={(e) =>
                          dispatch(
                            updateLocalOffice({
                              ...office,
                              isMainOffice: e.target.checked,
                            })
                          )
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label
                        htmlFor={`main-${office.id}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        Đặt làm chi nhánh chính
                      </label>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleSaveOffice(office.id)}
                        className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Lưu</span>
                      </button>
                      <button
                        onClick={() => {
                          if (office.id === 0) {
                            dispatch(removeNewOffice());
                          } else {
                            dispatch(setEditingOffice(null));
                          }
                        }}
                        className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {office.name}
                          </h3>
                          {office.isMainOffice && (
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 font-medium">
                              Chi nhánh chính
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start space-x-2">
                            <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{office.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                            <span>{office.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            <span>{office.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            <span>{office.workingTime}</span>
                          </div>
                          {office.googleMapEmbedUrl && (
                            <div className="flex items-center space-x-2">
                              <MapIcon className="w-5 h-5 text-gray-400" />
                              <a 
                                href={office.googleMapEmbedUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 underline"
                              >
                                Xem bản đồ
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => dispatch(setEditingOffice(office.id))}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffice(office.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
