"use client";

import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  const handleFieldChange = (field: keyof BannerSlide, value: string | boolean) => {
    onChange({
      ...banner,
      [field]: value,
    });
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
        <input
          type="text"
          value={banner.backgroundImage}
          onChange={(e) => handleFieldChange("backgroundImage", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
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
