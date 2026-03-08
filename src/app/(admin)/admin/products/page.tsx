"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  setEditingCategory,
  addNewCategory,
  updateLocalCategory,
  removeNewCategory,
} from "@/lib/features/productCategories/productCategoriesSlice";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setEditingProduct,
  addNewProduct,
  updateLocalProduct,
  removeNewProduct,
} from "@/lib/features/products/productsSlice";
import RichTextEditor from "@/components/RichTextEditor";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "products">("categories");
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<{ [key: number]: File }>({});
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState<{ [key: number]: boolean }>({});
  const [categoryImagePreview, setCategoryImagePreview] = useState<{ [key: number]: string }>({});
  const [selectedProductImage, setSelectedProductImage] = useState<{ [key: number]: File }>({});
  const [uploadingProductImage, setUploadingProductImage] = useState<{ [key: number]: boolean }>({});
  const [productImagePreview, setProductImagePreview] = useState<{ [key: number]: string }>({});
  const [selectedAdditionalImages, setSelectedAdditionalImages] = useState<{ [key: number]: File[] }>({});
  const [uploadingAdditionalImages, setUploadingAdditionalImages] = useState<{ [key: number]: boolean }>({});
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState<{ [key: number]: string[] }>({});
  const [imagesToDelete, setImagesToDelete] = useState<{ [key: number]: number[] }>({}); // Track storage media IDs to delete
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | undefined>(undefined);

  const dispatch = useAppDispatch();
  const {
    categories,
    loading: loadingCategories,
    error: categoriesError,
    editingCategoryId,
    pagination: categoryPagination,
  } = useAppSelector((state) => state.productCategories);

  const {
    products,
    loading: loadingProducts,
    error: productsError,
    editingProductId,
    pagination: productPagination,
  } = useAppSelector((state) => state.products);

  // Fetch data on mount and page change
  useEffect(() => {
    dispatch(fetchProductCategories({ page: currentCategoryPage, limit: 10 }));
  }, [dispatch, currentCategoryPage]);

  useEffect(() => {
    dispatch(fetchProducts({
      page: currentProductPage,
      limit: 10,
      search: searchQuery || undefined,
      categoryId: selectedCategoryFilter
    }));
  }, [dispatch, currentProductPage, searchQuery, selectedCategoryFilter]);

  // Category handlers
  const handleAddCategory = () => {
    dispatch(addNewCategory());
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      return;
    }

    try {
      await dispatch(deleteProductCategory(id)).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa danh mục. Vui lòng thử lại.");
    }
  };

  const handleCategoryImageChange = (categoryId: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
        setCategoryImagePreview(prev => ({
          ...prev,
          [categoryId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      setSelectedCategoryImage(prev => ({
        ...prev,
        [categoryId]: file
      }));
    }
  };

  const handleUploadCategoryImage = async (categoryId: number): Promise<string | null> => {
    const file = selectedCategoryImage[categoryId];
    if (!file) return null;

    setUploadingCategoryImage(prev => ({ ...prev, [categoryId]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/product-categories/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      const newSelectedImages = { ...selectedCategoryImage };
      const newPreviewImages = { ...categoryImagePreview };
      delete newSelectedImages[categoryId];
      delete newPreviewImages[categoryId];
      setSelectedCategoryImage(newSelectedImages);
      setCategoryImagePreview(newPreviewImages);

      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setUploadingCategoryImage(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleSaveCategory = async (id: number) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (!category.name) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      const isNewCategory = id === 0;

      // Upload image if a new file is selected
      let imageUrl = category.imageUrl;
      if (selectedCategoryImage[id]) {
        const uploadedUrl = await handleUploadCategoryImage(id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          dispatch(updateLocalCategory({
            ...category,
            imageUrl: imageUrl
          }));
        } else {
          alert('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      if (isNewCategory) {
        await dispatch(
          createProductCategory({
            name: category.name,
            description: category.description,
            imageUrl: imageUrl,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateProductCategory({
            id,
            category: {
              name: category.name,
              description: category.description,
              imageUrl: imageUrl,
            },
          })
        ).unwrap();
      }

      alert('Lưu danh mục thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu danh mục. Vui lòng thử lại.");
    }
  };

  // Product handlers
  const handleAddProduct = () => {
    dispatch(addNewProduct());
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      await dispatch(deleteProduct(id)).unwrap();
    } catch (err) {
      alert("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  };

  const handleProductImageChange = (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
        setProductImagePreview(prev => ({
          ...prev,
          [productId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      setSelectedProductImage(prev => ({
        ...prev,
        [productId]: file
      }));
    }
  };

  const handleAdditionalImagesChange = (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024;

    // Validate all files
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} không hợp lệ. Vui lòng chọn file ảnh (JPEG, PNG, WebP, GIF)`);
        return;
      }
      if (file.size > maxSize) {
        alert(`File ${file.name} vượt quá giới hạn 10MB`);
        return;
      }
    }

    // Create previews for all files
    const previews: string[] = [];
    let loadedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        loadedCount++;

        if (loadedCount === files.length) {
          setAdditionalImagesPreviews(prev => ({
            ...prev,
            [productId]: previews
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedAdditionalImages(prev => ({
      ...prev,
      [productId]: files
    }));
  };

  const handleUploadAdditionalImages = async (productId: number): Promise<boolean> => {
    const files = selectedAdditionalImages[productId];
    if (!files || files.length === 0) return true;

    setUploadingAdditionalImages(prev => ({ ...prev, [productId]: true }));

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('productId', productId.toString());

      const response = await fetch('/api/products/upload-additional', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload additional images');
        } else {
          // If not JSON, it's likely an HTML error page
          const text = await response.text();
          console.error('Server error response:', text);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // Clear the selected images after successful upload
      const newSelectedImages = { ...selectedAdditionalImages };
      const newPreviews = { ...additionalImagesPreviews };
      delete newSelectedImages[productId];
      delete newPreviews[productId];
      setSelectedAdditionalImages(newSelectedImages);
      setAdditionalImagesPreviews(newPreviews);

      return true;
    } catch (error) {
      console.error('Error uploading additional images:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh bổ sung. Vui lòng thử lại.');
      return false;
    } finally {
      setUploadingAdditionalImages(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleMarkImageForDeletion = (productId: number, mediaId: number) => {
    setImagesToDelete(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), mediaId]
    }));
  };

  const handleUnmarkImageForDeletion = (productId: number, mediaId: number) => {
    setImagesToDelete(prev => ({
      ...prev,
      [productId]: (prev[productId] || []).filter(id => id !== mediaId)
    }));
  };

  const handleRemoveSelectedImage = (productId: number, index: number) => {
    setSelectedAdditionalImages(prev => {
      const updated = { ...prev };
      const files = [...(updated[productId] || [])];
      files.splice(index, 1);
      if (files.length === 0) {
        delete updated[productId];
      } else {
        updated[productId] = files;
      }
      return updated;
    });

    setAdditionalImagesPreviews(prev => {
      const updated = { ...prev };
      const previews = [...(updated[productId] || [])];
      previews.splice(index, 1);
      if (previews.length === 0) {
        delete updated[productId];
      } else {
        updated[productId] = previews;
      }
      return updated;
    });
  };

  const handleDeleteMarkedImages = async (productId: number): Promise<boolean> => {
    const mediaIds = imagesToDelete[productId];
    if (!mediaIds || mediaIds.length === 0) return true;

    try {
      const response = await fetch('/api/storage-medias/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaIds }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete images');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // Clear the deletion list after successful deletion
      setImagesToDelete(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });

      return true;
    } catch (error) {
      console.error('Error deleting images:', error);
      alert(error instanceof Error ? error.message : 'Không thể xóa ảnh. Vui lòng thử lại.');
      return false;
    }
  };

  const handleUploadProductImage = async (productId: number): Promise<string | null> => {
    const file = selectedProductImage[productId];
    if (!file) return null;

    setUploadingProductImage(prev => ({ ...prev, [productId]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      const newSelectedImages = { ...selectedProductImage };
      const newPreviewImages = { ...productImagePreview };
      delete newSelectedImages[productId];
      delete newPreviewImages[productId];
      setSelectedProductImage(newSelectedImages);
      setProductImagePreview(newPreviewImages);

      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setUploadingProductImage(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleSaveProduct = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      const isNewProduct = id === 0;

      let imageUrl = product.imageUrl;
      if (selectedProductImage[id]) {
        const uploadedUrl = await handleUploadProductImage(id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          dispatch(updateLocalProduct({
            ...product,
            imageUrl: imageUrl
          }));
        } else {
          alert('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      if (!product.title || !product.categoryId) {
        alert('Vui lòng điền đầy đủ tên sản phẩm và chọn danh mục');
        return;
      }

      let savedProductId = id;

      if (isNewProduct) {
        const result = await dispatch(
          createProduct({
            title: product.title,
            introduction: product.introduction,
            description: product.description,
            specifications: product.specifications,
            guarantee: product.guarantee,
            categoryId: product.categoryId,
            price: product.price,
            original_price: product.original_price,
            isActive: product.isActive,
            isBestSeller: product.isBestSeller,
            showInHomePage: product.showInHomePage,
            imageUrl: imageUrl,
            order: product.order,
          })
        ).unwrap();
        savedProductId = result.id;
      } else {
        await dispatch(
          updateProduct({
            id,
            product: {
              title: product.title,
              introduction: product.introduction,
              description: product.description,
              specifications: product.specifications,
              guarantee: product.guarantee,
              categoryId: product.categoryId,
              price: product.price,
              original_price: product.original_price,
              isActive: product.isActive,
              isBestSeller: product.isBestSeller,
              showInHomePage: product.showInHomePage,
              imageUrl: imageUrl,
              order: product.order,
            },
          })
        ).unwrap();
      }

      // Delete marked images first
      if (imagesToDelete[id] && imagesToDelete[id].length > 0) {
        const deleteSuccess = await handleDeleteMarkedImages(id);
        if (!deleteSuccess) {
          alert('Sản phẩm đã được lưu nhưng không thể xóa một số ảnh đã đánh dấu.');
        }
      }

      // Upload additional images after product is saved
      // Use the original id to look up selected images, but savedProductId for the upload
      if (selectedAdditionalImages[id] && selectedAdditionalImages[id].length > 0) {
        // Update the selected images to use the saved product ID
        if (isNewProduct && savedProductId !== id) {
          setSelectedAdditionalImages(prev => {
            const updated = { ...prev };
            updated[savedProductId] = updated[id];
            delete updated[id];
            return updated;
          });
        }

        const uploadSuccess = await handleUploadAdditionalImages(savedProductId);
        if (!uploadSuccess) {
          alert('Sản phẩm đã được lưu nhưng không thể upload ảnh bổ sung.');
          return;
        }
      }

      alert('Lưu sản phẩm thành công!');

      // Refresh products to get updated storage medias
      dispatch(fetchProducts({
        page: currentProductPage,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: selectedCategoryFilter
      }));
    } catch (err) {
      alert("Không thể lưu sản phẩm. Vui lòng thử lại.");
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý danh mục sản phẩm và sản phẩm
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("categories")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "categories"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Danh mục sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "products"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Sản phẩm
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Danh mục sản phẩm
              </h2>
              <button
                onClick={handleAddCategory}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Thêm Danh mục</span>
              </button>
            </div>

            {categoriesError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {categoriesError}
              </div>
            )}

            {loadingCategories ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có danh mục nào. Nhấn &quot;Thêm Danh mục&quot; để tạo danh mục mới.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  {editingCategoryId === category.id ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Image Preview */}
                      <div className="md:col-span-1">
                        <div className="h-48 bg-gray-100 flex items-center justify-center p-4 relative">
                          {(categoryImagePreview[category.id] || category.imageUrl) ? (
                            <Image
                              src={categoryImagePreview[category.id] || category.imageUrl || ''}
                              alt={category.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized
                            />
                          ) : (
                            <PhotoIcon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Form */}
                      <div className="md:col-span-2 p-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên danh mục *
                            </label>
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) =>
                                dispatch(
                                  updateLocalCategory({
                                    ...category,
                                    name: e.target.value,
                                  })
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Tên danh mục"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả
                            </label>
                            <textarea
                              value={category.description || ''}
                              onChange={(e) =>
                                dispatch(
                                  updateLocalCategory({
                                    ...category,
                                    description: e.target.value,
                                  })
                                )
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Mô tả danh mục"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hình ảnh danh mục
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              onChange={(e) => handleCategoryImageChange(category.id, e)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              disabled={uploadingCategoryImage[category.id]}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Chọn ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB). Ảnh sẽ tự động chuyển đổi sang WebP
                            </p>
                            {selectedCategoryImage[category.id] && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Đã chọn: {selectedCategoryImage[category.id].name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => handleSaveCategory(category.id)}
                              disabled={uploadingCategoryImage[category.id]}
                              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingCategoryImage[category.id] ? (
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
                                if (category.id === 0) {
                                  dispatch(removeNewCategory());
                                } else {
                                  dispatch(setEditingCategory(null));
                                }
                                const newSelectedImages = { ...selectedCategoryImage };
                                const newPreviewImages = { ...categoryImagePreview };
                                delete newSelectedImages[category.id];
                                delete newPreviewImages[category.id];
                                setSelectedCategoryImage(newSelectedImages);
                                setCategoryImagePreview(newPreviewImages);
                              }}
                              disabled={uploadingCategoryImage[category.id]}
                              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              <span>Hủy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Image Display */}
                      <div className="md:col-span-1">
                        <div className="h-48 bg-gray-100 flex items-center justify-center p-4 relative">
                          {category.imageUrl ? (
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized
                            />
                          ) : (
                            <PhotoIcon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="md:col-span-2 p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {category.description}
                              </p>
                            )}
                            {category._count && (
                              <p className="text-xs text-gray-500 mt-2">
                                {category._count.products} sản phẩm
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => dispatch(setEditingCategory(category.id))}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              pagination={categoryPagination}
              currentPage={currentCategoryPage}
              onPageChange={setCurrentCategoryPage}
            />
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Sản phẩm
              </h2>
              <button
                onClick={handleAddProduct}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Thêm Sản phẩm</span>
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm sản phẩm
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
                        setCurrentProductPage(1); // Reset to first page on search
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tìm theo tên sản phẩm..."
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc theo danh mục
                  </label>
                  <select
                    value={selectedCategoryFilter || ""}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : undefined);
                      setCurrentProductPage(1); // Reset to first page on filter
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedCategoryFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategoryFilter(undefined);
                      setCurrentProductPage(1);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

            {productsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {productsError}
              </div>
            )}

            {loadingProducts ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có sản phẩm nào. Nhấn &quot;Thêm Sản phẩm&quot; để tạo sản phẩm mới.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Image Preview */}
                    <div className="md:col-span-1">
                      <div className="h-48 bg-gray-100 flex items-center justify-center p-4 relative">
                        {(productImagePreview[product.id] || product.imageUrl) ? (
                          <Image
                            src={productImagePreview[product.id] || product.imageUrl || ''}
                            alt={product.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            unoptimized
                          />
                        ) : (
                          <PhotoIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2 p-6">
                      {editingProductId === product.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên sản phẩm *
                              </label>
                              <input
                                type="text"
                                value={product.title}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      title: e.target.value,
                                    })
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Tên sản phẩm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Danh mục *
                              </label>
                              <select
                                value={product.categoryId}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      categoryId: parseInt(e.target.value),
                                    })
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value={0}>Chọn danh mục</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Giới thiệu
                            </label>
                            <textarea
                              value={product.introduction || ''}
                              onChange={(e) =>
                                dispatch(
                                  updateLocalProduct({
                                    ...product,
                                    introduction: e.target.value,
                                  })
                                )
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Giới thiệu ngắn gọn về sản phẩm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả
                            </label>
                            <RichTextEditor
                              value={product.description || ''}
                              onChange={(value) =>
                                dispatch(
                                  updateLocalProduct({
                                    ...product,
                                    description: value,
                                  })
                                )
                              }
                              placeholder="Mô tả chi tiết sản phẩm"
                              productId={product.id !== 0 ? product.id : undefined}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Thông số kỹ thuật
                            </label>
                            <RichTextEditor
                              value={product.specifications || ''}
                              onChange={(value) =>
                                dispatch(
                                  updateLocalProduct({
                                    ...product,
                                    specifications: value,
                                  })
                                )
                              }
                              placeholder="Thông số kỹ thuật của sản phẩm"
                              productId={product.id !== 0 ? product.id : undefined}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bảo hành
                            </label>
                            <RichTextEditor
                              value={product.guarantee || ''}
                              onChange={(value) =>
                                dispatch(
                                  updateLocalProduct({
                                    ...product,
                                    guarantee: value,
                                  })
                                )
                              }
                              placeholder="Thông tin bảo hành sản phẩm"
                              productId={product.id !== 0 ? product.id : undefined}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giá gốc (VNĐ)
                              </label>
                              <input
                                type="text"
                                value={product.original_price || ''}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      original_price: e.target.value || null,
                                    })
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Ví dụ: 10,000,000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giá sau khuyến mãi (VNĐ)
                              </label>
                              <input
                                type="text"
                                value={product.price || ''}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      price: e.target.value || null,
                                    })
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Ví dụ: 8,500,000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Thứ tự hiển thị
                            </label>
                            <input
                              type="number"
                              value={product.order}
                              onChange={(e) =>
                                dispatch(
                                  updateLocalProduct({
                                    ...product,
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
                              Hình ảnh sản phẩm
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              onChange={(e) => handleProductImageChange(product.id, e)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              disabled={uploadingProductImage[product.id]}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Chọn ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB). Ảnh sẽ tự động chuyển đổi sang WebP
                            </p>
                            {selectedProductImage[product.id] && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Đã chọn: {selectedProductImage[product.id].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ảnh bổ sung (Additional Images)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              multiple
                              onChange={(e) => handleAdditionalImagesChange(product.id, e)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              disabled={uploadingAdditionalImages[product.id]}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Chọn nhiều ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB mỗi ảnh). Ảnh sẽ tự động chuyển đổi sang WebP
                            </p>
                            {selectedAdditionalImages[product.id] && selectedAdditionalImages[product.id].length > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Đã chọn {selectedAdditionalImages[product.id].length} ảnh
                              </p>
                            )}
                            {additionalImagesPreviews[product.id] && additionalImagesPreviews[product.id].length > 0 && (
                              <div className="mt-2 grid grid-cols-4 gap-2">
                                {additionalImagesPreviews[product.id].map((preview, idx) => (
                                  <div key={idx} className="relative h-20 bg-gray-100 rounded border-2 border-gray-200 group">
                                    <Image
                                      src={preview}
                                      alt={`Preview ${idx + 1}`}
                                      fill
                                      className="object-cover rounded"
                                      sizes="(max-width: 768px) 25vw, 20vw"
                                      unoptimized
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSelectedImage(product.id, idx)}
                                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      title="Xóa ảnh"
                                    >
                                      <TrashIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {product.storageMedias && product.storageMedias.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Ảnh đã tải lên:</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {product.storageMedias.map((media) => {
                                    const isMarkedForDeletion = imagesToDelete[product.id]?.includes(media.id);
                                    return (
                                      <div
                                        key={media.id}
                                        className={`relative h-20 bg-gray-100 rounded border-2 group ${isMarkedForDeletion
                                          ? 'border-red-500 opacity-50'
                                          : 'border-green-200'
                                          }`}
                                      >
                                        <Image
                                          src={media.path.replace('public', '')}
                                          alt={`Storage ${media.id}`}
                                          fill
                                          className="object-cover rounded"
                                          sizes="(max-width: 768px) 25vw, 20vw"
                                          unoptimized
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isMarkedForDeletion) {
                                              handleUnmarkImageForDeletion(product.id, media.id);
                                            } else {
                                              handleMarkImageForDeletion(product.id, media.id);
                                            }
                                          }}
                                          className={`absolute top-1 right-1 rounded-full p-1 transition-all ${isMarkedForDeletion
                                            ? 'bg-yellow-500 hover:bg-yellow-600 opacity-100'
                                            : 'bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100'
                                            } text-white`}
                                          title={isMarkedForDeletion ? 'Hủy xóa' : 'Đánh dấu xóa'}
                                        >
                                          {isMarkedForDeletion ? (
                                            <XMarkIcon className="w-3 h-3" />
                                          ) : (
                                            <TrashIcon className="w-3 h-3" />
                                          )}
                                        </button>
                                        {isMarkedForDeletion && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                            <span className="text-white text-xs font-bold">Sẽ xóa</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`active-${product.id}`}
                                checked={product.isActive}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      isActive: e.target.checked,
                                    })
                                  )
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <label
                                htmlFor={`active-${product.id}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                Hiển thị sản phẩm
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`bestseller-${product.id}`}
                                checked={product.isBestSeller}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      isBestSeller: e.target.checked,
                                    })
                                  )
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <label
                                htmlFor={`bestseller-${product.id}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                Sản phẩm bán chạy
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`homepage-${product.id}`}
                                checked={product.showInHomePage}
                                onChange={(e) =>
                                  dispatch(
                                    updateLocalProduct({
                                      ...product,
                                      showInHomePage: e.target.checked,
                                    })
                                  )
                                }
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <label
                                htmlFor={`homepage-${product.id}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                Hiển thị trên trang chủ
                              </label>
                            </div>
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => handleSaveProduct(product.id)}
                              disabled={uploadingProductImage[product.id]}
                              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingProductImage[product.id] ? (
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
                                if (product.id === 0) {
                                  dispatch(removeNewProduct());
                                } else {
                                  dispatch(setEditingProduct(null));
                                }
                                const newSelectedImages = { ...selectedProductImage };
                                const newPreviewImages = { ...productImagePreview };
                                delete newSelectedImages[product.id];
                                delete newPreviewImages[product.id];
                                setSelectedProductImage(newSelectedImages);
                                setProductImagePreview(newPreviewImages);
                              }}
                              disabled={uploadingProductImage[product.id]}
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
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {product.title}
                              </h3>
                              {product.category && (
                                <p className="text-sm text-primary-600 mt-1">
                                  {product.category.name}
                                </p>
                              )}
                              {product.introduction && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Giới thiệu:</strong> {product.introduction}
                                </p>
                              )}
                              {product.description && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                  <strong className="text-sm text-gray-700">Mô tả:</strong>
                                  <div
                                    className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                  />
                                </div>
                              )}
                              {product.specifications && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                  <strong className="text-sm text-gray-700">Thông số kỹ thuật:</strong>
                                  <div
                                    className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: product.specifications }}
                                  />
                                </div>
                              )}
                              {product.guarantee && (
                                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                  <strong className="text-sm text-gray-700">Bảo hành:</strong>
                                  <div
                                    className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: product.guarantee }}
                                  />
                                </div>
                              )}
                              <div className="mt-2 flex items-center space-x-4 text-sm">
                                {product.original_price && (
                                  <span className="text-gray-500 line-through">
                                    {product.original_price} VNĐ
                                  </span>
                                )}
                                {product.price && (
                                  <span className="font-semibold text-gray-900">
                                    {product.price} VNĐ
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center flex-wrap gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${product.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {product.isActive ? "Hiển thị" : "Ẩn"}
                                </span>
                                {product.isBestSeller && (
                                  <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                    Bán chạy
                                  </span>
                                )}
                                {product.showInHomePage && (
                                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                    Trang chủ
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => dispatch(setEditingProduct(product.id))}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
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
              pagination={productPagination}
              currentPage={currentProductPage}
              onPageChange={setCurrentProductPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
