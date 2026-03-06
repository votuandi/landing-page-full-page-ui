"use client";

import { CheckIcon, XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  backgroundColor: string;
  isActive: boolean;
}

interface BannerFormProps {
  banner: BannerSlide;
  onChange: (updatedBanner: BannerSlide) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function BannerForm({
  banner,
  onChange,
  onSave,
  onCancel,
}: BannerFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof BannerSlide, value: string | boolean) => {
    onChange({
      ...banner,
      [field]: value,
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Kích thước file không được vượt quá 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      // Update the banner with the new image URL
      handleFieldChange('backgroundImage', data.imageUrl);
      setUploadError(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Lỗi khi tải ảnh lên');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề
        </label>
        <input
          type="text"
          value={banner.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phụ đề
        </label>
        <input
          type="text"
          value={banner.subtitle}
          onChange={(e) => handleFieldChange("subtitle", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          value={banner.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text nút
          </label>
          <input
            type="text"
            value={banner.buttonText}
            onChange={(e) => handleFieldChange("buttonText", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link nút
          </label>
          <input
            type="text"
            value={banner.buttonLink}
            onChange={(e) => handleFieldChange("buttonLink", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL hình ảnh
        </label>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Image preview */}
        {(previewUrl || banner.backgroundImage) && (
          <div className="mb-2 relative w-full h-32 rounded-lg overflow-hidden border border-gray-300">
            <img
              src={previewUrl || banner.backgroundImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Upload button and URL input */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleChooseImage}
            disabled={uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <PhotoIcon className="w-5 h-5" />
            <span>{uploading ? 'Đang tải...' : 'Chọn ảnh'}</span>
          </button>
          
          <input
            type="text"
            value={banner.backgroundImage}
            onChange={(e) => handleFieldChange("backgroundImage", e.target.value)}
            placeholder="hoặc nhập URL trực tiếp"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        {/* Error message */}
        {uploadError && (
          <p className="mt-1 text-sm text-red-600">{uploadError}</p>
        )}
        
        {/* Help text */}
        <p className="mt-1 text-xs text-gray-500">
          Chọn ảnh từ thiết bị (tự động chuyển sang WebP) hoặc nhập URL trực tiếp
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={banner.isActive}
            onChange={(e) => handleFieldChange("isActive", e.target.checked)}
            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Đang hoạt động</span>
        </label>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onSave}
          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          <span>Lưu</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Hủy</span>
        </button>
      </div>
    </div>
  );
}
