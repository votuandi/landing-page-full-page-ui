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
  fetchNews,
  createNews,
  updateNews,
  deleteNews,
  setEditingNews,
  addNewNews,
  updateLocalNews,
  removeNewNews,
} from "@/lib/features/news/newsSlice";
import RichTextEditor from "@/components/RichTextEditor";

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<{ [key: number]: File }>({});
  const [uploadingImage, setUploadingImage] = useState<{ [key: number]: boolean }>({});
  const [imagePreview, setImagePreview] = useState<{ [key: number]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState<{ [key: number]: string }>({});

  const dispatch = useAppDispatch();
  const {
    newsList,
    loading,
    error,
    editingNewsId,
    pagination,
  } = useAppSelector((state) => state.news);

  // Get unique categories from news list
  const categories = Array.from(new Set(newsList.map((news) => news.category)));

  // Fetch data on mount and page change
  useEffect(() => {
    dispatch(fetchNews({
      page: currentPage,
      limit: 10,
      search: searchQuery || undefined,
      category: selectedCategory
    }));
  }, [dispatch, currentPage, searchQuery, selectedCategory]);

  // News handlers
  const handleAddNews = () => {
    dispatch(addNewNews());
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin tức này?")) {
      return;
    }

    try {
      await dispatch(deleteNews(id)).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa tin tức. Vui lòng thử lại.");
    }
  };

  const handleImageChange = (newsId: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
          [newsId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      setSelectedImage(prev => ({
        ...prev,
        [newsId]: file
      }));
    }
  };

  const handleUploadImage = async (newsId: number): Promise<string | null> => {
    const file = selectedImage[newsId];
    if (!file) return null;

    setUploadingImage(prev => ({ ...prev, [newsId]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/news/upload', {
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
      delete newSelectedImages[newsId];
      delete newPreviewImages[newsId];
      setSelectedImage(newSelectedImages);
      setImagePreview(newPreviewImages);

      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setUploadingImage(prev => ({ ...prev, [newsId]: false }));
    }
  };

  const handleSaveNews = async (id: number) => {
    const news = newsList.find((n) => n.id === id);
    if (!news) return;

    if (!news.title || !news.excerpt || !news.content) {
      alert('Vui lòng nhập đầy đủ tiêu đề, tóm tắt và nội dung');
      return;
    }

    try {
      const isNewNews = id === 0;

      // Upload image if a new file is selected
      let imageUrl = news.imageUrl;
      if (selectedImage[id]) {
        const uploadedUrl = await handleUploadImage(id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          dispatch(updateLocalNews({
            ...news,
            imageUrl: imageUrl
          }));
        } else {
          alert('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      if (isNewNews) {
        await dispatch(
          createNews({
            title: news.title,
            excerpt: news.excerpt,
            content: news.content,
            author: news.author,
            category: news.category,
            readTime: news.readTime,
            imageUrl: imageUrl,
            tags: news.tags,
            isActive: news.isActive,
            order: news.order,
            publishedAt: news.publishedAt,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateNews({
            id,
            news: {
              title: news.title,
              excerpt: news.excerpt,
              content: news.content,
              author: news.author,
              category: news.category,
              readTime: news.readTime,
              imageUrl: imageUrl,
              tags: news.tags,
              isActive: news.isActive,
              order: news.order,
              publishedAt: news.publishedAt,
            },
          })
        ).unwrap();
      }

      alert('Lưu tin tức thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu tin tức. Vui lòng thử lại.");
    }
  };

  const handleAddTag = (newsId: number) => {
    const news = newsList.find((n) => n.id === newsId);
    const input = tagInput[newsId]?.trim();
    
    if (!news || !input) return;

    if (!news.tags.includes(input)) {
      dispatch(updateLocalNews({
        ...news,
        tags: [...news.tags, input]
      }));
    }
    
    setTagInput(prev => ({ ...prev, [newsId]: '' }));
  };

  const handleRemoveTag = (newsId: number, tagToRemove: string) => {
    const news = newsList.find((n) => n.id === newsId);
    if (!news) return;

    dispatch(updateLocalNews({
      ...news,
      tags: news.tags.filter(tag => tag !== tagToRemove)
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tin tức</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý tin tức và bài viết về năng lượng mặt trời
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Danh sách tin tức
          </h2>
          <button
            onClick={handleAddNews}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Thêm Tin tức</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm tin tức
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
                  placeholder="Tìm theo tiêu đề, nội dung..."
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
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
        ) : newsList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có tin tức nào. Nhấn &quot;Thêm Tin tức&quot; để tạo tin tức mới.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {/* Image Preview */}
                <div className="md:col-span-1">
                  <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                    {(imagePreview[news.id] || news.imageUrl) ? (
                      <img
                        src={imagePreview[news.id] || news.imageUrl || ''}
                        alt={news.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Form/Display */}
                <div className="md:col-span-2 p-6">
                  {editingNewsId === news.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề *
                          </label>
                          <input
                            type="text"
                            value={news.title}
                            onChange={(e) =>
                              dispatch(
                                updateLocalNews({
                                  ...news,
                                  title: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Tiêu đề tin tức"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Danh mục
                          </label>
                          <input
                            type="text"
                            value={news.category}
                            onChange={(e) =>
                              dispatch(
                                updateLocalNews({
                                  ...news,
                                  category: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ví dụ: Tin tức, Chính sách"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tóm tắt *
                        </label>
                        <textarea
                          value={news.excerpt}
                          onChange={(e) =>
                            dispatch(
                              updateLocalNews({
                                ...news,
                                excerpt: e.target.value,
                              })
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Tóm tắt ngắn gọn về tin tức"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nội dung *
                        </label>
                        <RichTextEditor
                          value={news.content}
                          onChange={(value) =>
                            dispatch(
                              updateLocalNews({
                                ...news,
                                content: value,
                              })
                            )
                          }
                          placeholder="Nội dung chi tiết tin tức"
                          newsId={news.id}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tác giả
                          </label>
                          <input
                            type="text"
                            value={news.author}
                            onChange={(e) =>
                              dispatch(
                                updateLocalNews({
                                  ...news,
                                  author: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Tên tác giả"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian đọc
                          </label>
                          <input
                            type="text"
                            value={news.readTime}
                            onChange={(e) =>
                              dispatch(
                                updateLocalNews({
                                  ...news,
                                  readTime: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ví dụ: 5 phút đọc"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thứ tự hiển thị
                          </label>
                          <input
                            type="number"
                            value={news.order}
                            onChange={(e) =>
                              dispatch(
                                updateLocalNews({
                                  ...news,
                                  order: parseInt(e.target.value) || 0,
                                })
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hình ảnh tin tức
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => handleImageChange(news.id, e)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          disabled={uploadingImage[news.id]}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Chọn ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB). Ảnh sẽ tự động chuyển đổi sang WebP
                        </p>
                        {selectedImage[news.id] && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Đã chọn: {selectedImage[news.id].name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={tagInput[news.id] || ''}
                            onChange={(e) => setTagInput(prev => ({ ...prev, [news.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag(news.id);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Nhập tag và nhấn Enter"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag(news.id)}
                            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                          >
                            <TagIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {news.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(news.id, tag)}
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
                          id={`active-${news.id}`}
                          checked={news.isActive}
                          onChange={(e) =>
                            dispatch(
                              updateLocalNews({
                                ...news,
                                isActive: e.target.checked,
                              })
                            )
                          }
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`active-${news.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Hiển thị tin tức
                        </label>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleSaveNews(news.id)}
                          disabled={uploadingImage[news.id]}
                          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage[news.id] ? (
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
                            if (news.id === 0) {
                              dispatch(removeNewNews());
                            } else {
                              dispatch(setEditingNews(null));
                            }
                            const newSelectedImages = { ...selectedImage };
                            const newPreviewImages = { ...imagePreview };
                            delete newSelectedImages[news.id];
                            delete newPreviewImages[news.id];
                            setSelectedImage(newSelectedImages);
                            setImagePreview(newPreviewImages);
                          }}
                          disabled={uploadingImage[news.id]}
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
                              {news.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs ${news.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {news.isActive ? "Hiển thị" : "Ẩn"}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mb-2">
                            {news.category} • {news.readTime}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Tóm tắt:</strong> {news.excerpt}
                          </p>
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <strong className="text-sm text-gray-700">Nội dung:</strong>
                            <div
                              className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none max-h-32 overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: news.content }}
                            />
                          </div>
                          {news.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {news.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Tác giả: {news.author} • Ngày đăng: {new Date(news.publishedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => dispatch(setEditingNews(news.id))}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(news.id)}
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
