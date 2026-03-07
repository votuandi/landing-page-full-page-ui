"use client";

import { useState, useEffect } from "react";
import {
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  setEditingService,
  addNewService,
  updateLocalService,
  removeNewService,
} from "@/lib/features/services/servicesSlice";
import RichTextEditor from "@/components/RichTextEditor";

const SERVICE_CATEGORIES = [
  { id: "all", name: "Tất cả dịch vụ" },
  { id: "household", name: "Hộ gia đình" },
  { id: "business", name: "Doanh nghiệp" },
  { id: "maintenance", name: "Bảo trì" },
  { id: "consultation", name: "Tư vấn" },
];

export default function ServicePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<{ [key: number]: File }>({});
  const [uploadingImage, setUploadingImage] = useState<{ [key: number]: boolean }>({});
  const [imagePreview, setImagePreview] = useState<{ [key: number]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [featureInput, setFeatureInput] = useState<{ [key: number]: string }>({});

  const dispatch = useAppDispatch();
  const {
    services,
    loading,
    error,
    editingServiceId,
    pagination,
  } = useAppSelector((state) => state.services);

  // Fetch data on mount and page change
  useEffect(() => {
    dispatch(fetchServices({
      page: currentPage,
      limit: 10,
      search: searchQuery || undefined,
      category: selectedCategory
    }));
  }, [dispatch, currentPage, searchQuery, selectedCategory]);

  // Service handlers
  const handleAddService = () => {
    dispatch(addNewService());
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      return;
    }

    try {
      await dispatch(deleteService(id)).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa dịch vụ. Vui lòng thử lại.");
    }
  };

  const handleImageChange = (serviceId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, WebP, GIF)');
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`Kích thước file vượt quá giới hạn 10MB. File của bạn: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => ({
          ...prev,
          [serviceId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      setSelectedImage(prev => ({
        ...prev,
        [serviceId]: file
      }));
    }
  };

  const handleUploadImage = async (serviceId: number): Promise<string | null> => {
    const file = selectedImage[serviceId];
    if (!file) return null;

    setUploadingImage(prev => ({ ...prev, [serviceId]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/services/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      const newSelectedImages = { ...selectedImage };
      const newPreviewImages = { ...imagePreview };
      delete newSelectedImages[serviceId];
      delete newPreviewImages[serviceId];
      setSelectedImage(newSelectedImages);
      setImagePreview(newPreviewImages);

      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setUploadingImage(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleSaveService = async (id: number) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;

    if (!service.title) {
      alert('Vui lòng nhập tiêu đề dịch vụ');
      return;
    }

    try {
      const isNewService = id === 0;

      // Upload image if a new file is selected
      let image = service.image;
      if (selectedImage[id]) {
        const uploadedUrl = await handleUploadImage(id);
        if (uploadedUrl) {
          image = uploadedUrl;
          dispatch(updateLocalService({
            ...service,
            image: image
          }));
        } else {
          alert('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      if (isNewService) {
        await dispatch(
          createService({
            title: service.title,
            description: service.description,
            image: image,
            features: service.features,
            price: service.price,
            category: service.category,
            duration: service.duration,
            warranty: service.warranty,
            isActive: service.isActive,
            order: service.order,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateService({
            id,
            service: {
              title: service.title,
              description: service.description,
              image: image,
              features: service.features,
              price: service.price,
              category: service.category,
              duration: service.duration,
              warranty: service.warranty,
              isActive: service.isActive,
              order: service.order,
            },
          })
        ).unwrap();
      }

      alert('Lưu dịch vụ thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu dịch vụ. Vui lòng thử lại.");
    }
  };

  const handleAddFeature = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    const input = featureInput[serviceId]?.trim();
    
    if (!service || !input) return;

    if (!service.features.includes(input)) {
      dispatch(updateLocalService({
        ...service,
        features: [...service.features, input]
      }));
    }
    
    setFeatureInput(prev => ({ ...prev, [serviceId]: '' }));
  };

  const handleRemoveFeature = (serviceId: number, featureToRemove: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    dispatch(updateLocalService({
      ...service,
      features: service.features.filter(feature => feature !== featureToRemove)
    }));
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý các dịch vụ điện và năng lượng mặt trời
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Danh sách dịch vụ
          </h2>
          <button
            onClick={handleAddService}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Thêm Dịch vụ</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm dịch vụ
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
                  placeholder="Tìm theo tiêu đề, mô tả..."
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo danh mục
              </label>
              <select
                value={selectedCategory || ""}
                onChange={(e) => {
                  setSelectedCategory(e.target.value || undefined);
                  setCurrentPage(1);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id === "all" ? "" : cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedCategory) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(undefined);
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
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có dịch vụ nào. Nhấn &quot;Thêm Dịch vụ&quot; để tạo dịch vụ mới.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {/* Image Preview */}
                <div className="md:col-span-1">
                  <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                    {(imagePreview[service.id] || service.image) ? (
                      <img
                        src={imagePreview[service.id] || service.image || ''}
                        alt={service.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Form/Display */}
                <div className="md:col-span-2 p-6">
                  {editingServiceId === service.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề *
                          </label>
                          <input
                            type="text"
                            value={service.title}
                            onChange={(e) =>
                              dispatch(
                                updateLocalService({
                                  ...service,
                                  title: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Tiêu đề dịch vụ"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Danh mục
                          </label>
                          <select
                            value={service.category}
                            onChange={(e) =>
                              dispatch(
                                updateLocalService({
                                  ...service,
                                  category: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {SERVICE_CATEGORIES.filter(cat => cat.id !== "all").map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả
                        </label>
                        <RichTextEditor
                          value={service.description || ''}
                          onChange={(value) =>
                            dispatch(
                              updateLocalService({
                                ...service,
                                description: value,
                              })
                            )
                          }
                          placeholder="Mô tả chi tiết về dịch vụ"
                          className="border border-gray-300 rounded-lg"
                          serviceId={service.id === 0 ? undefined : service.id}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giá
                          </label>
                          <input
                            type="text"
                            value={service.price || ''}
                            onChange={(e) =>
                              dispatch(
                                updateLocalService({
                                  ...service,
                                  price: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ví dụ: Liên hệ"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian
                          </label>
                          <input
                            type="text"
                            value={service.duration || ''}
                            onChange={(e) =>
                              dispatch(
                                updateLocalService({
                                  ...service,
                                  duration: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ví dụ: 1-2 ngày"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bảo hành
                          </label>
                          <input
                            type="text"
                            value={service.warranty || ''}
                            onChange={(e) =>
                              dispatch(
                                updateLocalService({
                                  ...service,
                                  warranty: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ví dụ: 12 tháng"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thứ tự hiển thị
                        </label>
                        <input
                          type="number"
                          value={service.order}
                          onChange={(e) =>
                            dispatch(
                              updateLocalService({
                                ...service,
                                order: parseInt(e.target.value) || 0,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hình ảnh dịch vụ
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => handleImageChange(service.id, e)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          disabled={uploadingImage[service.id]}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Chọn ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB). Ảnh sẽ tự động chuyển đổi sang WebP
                        </p>
                        {selectedImage[service.id] && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Đã chọn: {selectedImage[service.id].name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tính năng
                        </label>
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={featureInput[service.id] || ''}
                            onChange={(e) => setFeatureInput(prev => ({ ...prev, [service.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFeature(service.id);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Nhập tính năng và nhấn Enter"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddFeature(service.id)}
                            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                          >
                            <TagIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {service.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                            >
                              {feature}
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(service.id, feature)}
                                className="ml-2 hover:text-primary-900"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`active-${service.id}`}
                          checked={service.isActive}
                          onChange={(e) =>
                            dispatch(
                              updateLocalService({
                                ...service,
                                isActive: e.target.checked,
                              })
                            )
                          }
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`active-${service.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Hiển thị dịch vụ
                        </label>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleSaveService(service.id)}
                          disabled={uploadingImage[service.id]}
                          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage[service.id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang upload...</span>
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              <span>Lưu</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (service.id === 0) {
                              dispatch(removeNewService());
                            } else {
                              dispatch(setEditingService(null));
                            }
                            const newSelectedImages = { ...selectedImage };
                            const newPreviewImages = { ...imagePreview };
                            delete newSelectedImages[service.id];
                            delete newPreviewImages[service.id];
                            setSelectedImage(newSelectedImages);
                            setImagePreview(newPreviewImages);
                          }}
                          disabled={uploadingImage[service.id]}
                          className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>Hủy</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {service.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs ${service.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {service.isActive ? "Hiển thị" : "Ẩn"}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mb-2">
                            {SERVICE_CATEGORIES.find(cat => cat.id === service.category)?.name || service.category}
                          </p>
                          {service.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Mô tả:</strong>
                              <div 
                                className="mt-1 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: service.description }}
                              />
                            </div>
                          )}
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            {service.price && (
                              <div>
                                <strong className="text-gray-700">Giá:</strong> {service.price}
                              </div>
                            )}
                            {service.duration && (
                              <div>
                                <strong className="text-gray-700">Thời gian:</strong> {service.duration}
                              </div>
                            )}
                            {service.warranty && (
                              <div>
                                <strong className="text-gray-700">Bảo hành:</strong> {service.warranty}
                              </div>
                            )}
                          </div>
                          {service.features.length > 0 && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">Tính năng:</strong>
                              <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                                {service.features.map((feature, idx) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => dispatch(setEditingService(service.id))}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
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
