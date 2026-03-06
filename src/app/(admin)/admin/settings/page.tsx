"use client";

import { useState, useEffect } from "react";
import {
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import BannerForm from "@/components/BannerForm";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  setEditingBanner,
  addNewBanner,
  updateLocalBanner,
} from "@/lib/features/banners/bannersSlice";
import {
  setEditing,
  updateTitle,
  updateDescription,
  updateVideoUrl,
  updateAchievementField,
  saveIntroduction,
} from "@/lib/features/introduction/introductionSlice";
import { checkDatabaseConnection } from "@/lib/features/database/databaseSlice";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"banners" | "introduction" | "database">(
    "banners"
  );

  // Redux state
  const dispatch = useAppDispatch();
  const { banners, loading, error, editingBannerId } = useAppSelector((state) => state.banners);
  const { data: quickIntroduction, isEditing: editingIntroduction } = useAppSelector(
    (state) => state.introduction
  );
  const { status: databaseStatus, checking: checkingDatabase } = useAppSelector(
    (state) => state.database
  );

  // Fetch banners on mount
  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const handleAddBanner = () => {
    dispatch(addNewBanner());
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      return;
    }

    try {
      await dispatch(deleteBanner(id)).unwrap();
    } catch (err) {
      alert("Không thể xóa banner. Vui lòng thử lại.");
    }
  };

  const handleSaveBanner = async (id: number) => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return;

    try {
      const isNewBanner = id === 0;
      const order = banners.indexOf(banner);

      if (isNewBanner) {
        await dispatch(
          createBanner({
            title: banner.title,
            subtitle: banner.subtitle,
            description: banner.description,
            buttonText: banner.buttonText,
            buttonLink: banner.buttonLink,
            backgroundImage: banner.backgroundImage,
            backgroundColor: banner.backgroundColor,
            isActive: banner.isActive,
            order,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateBanner({
            id,
            banner: {
              title: banner.title,
              subtitle: banner.subtitle,
              description: banner.description,
              buttonText: banner.buttonText,
              buttonLink: banner.buttonLink,
              backgroundImage: banner.backgroundImage,
              backgroundColor: banner.backgroundColor,
              isActive: banner.isActive,
              order,
            },
          })
        ).unwrap();
      }
    } catch (err) {
      alert("Không thể lưu banner. Vui lòng thử lại.");
    }
  };

  const handleSaveIntroduction = () => {
    dispatch(saveIntroduction());
  };

  const handleCheckDatabase = () => {
    dispatch(checkDatabaseConnection());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý banner và nội dung giới thiệu nhanh
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("banners")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "banners"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Banner
            </button>
            <button
              onClick={() => setActiveTab("introduction")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "introduction"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Giới thiệu nhanh
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "database"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Kết nối database
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === "banners" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quản lý Banner
              </h2>
              <button
                onClick={handleAddBanner}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Thêm Banner</span>
              </button>
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
            ) : banners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có banner nào. Nhấn &quot;Thêm Banner&quot; để tạo banner mới.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Preview */}
                    <div className="md:col-span-1">
                      <div
                        className="h-48 bg-cover bg-center relative"
                        style={{
                          backgroundImage: banner.backgroundImage
                            ? `url(${banner.backgroundImage})`
                            : "none",
                          backgroundColor: banner.backgroundImage
                            ? "transparent"
                            : "#e5e7eb",
                        }}
                      >
                        {!banner.backgroundImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PhotoIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white px-4">
                            <h3 className="font-bold text-lg mb-1">
                              {banner.title || "Tiêu đề"}
                            </h3>
                            <p className="text-sm opacity-90">
                              {banner.subtitle || "Phụ đề"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2 p-6">
                      {editingBannerId === banner.id ? (
                        <BannerForm
                          banner={banner}
                          onChange={(updatedBanner) =>
                            dispatch(updateLocalBanner(updatedBanner))
                          }
                          onSave={() => handleSaveBanner(banner.id)}
                          onCancel={() => dispatch(setEditingBanner(null))}
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {banner.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {banner.subtitle}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {banner.description}
                              </p>
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                <span>
                                  Nút: {banner.buttonText} → {banner.buttonLink}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded ${
                                    banner.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {banner.isActive ? "Hoạt động" : "Tạm dừng"}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => dispatch(setEditingBanner(banner.id))}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(banner.id)}
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
          </div>
        )}

        {activeTab === "introduction" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Giới thiệu nhanh
              </h2>
              {!editingIntroduction && (
                <button
                  onClick={() => dispatch(setEditing(true))}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              {editingIntroduction ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={quickIntroduction.title}
                      onChange={(e) => dispatch(updateTitle(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={quickIntroduction.description}
                      onChange={(e) => dispatch(updateDescription(e.target.value))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Video
                    </label>
                    <input
                      type="text"
                      value={quickIntroduction.videoUrl}
                      onChange={(e) => dispatch(updateVideoUrl(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Thành tựu
                    </label>
                    <div className="space-y-4">
                      {quickIntroduction.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Icon
                            </label>
                            <input
                              type="text"
                              value={achievement.icon}
                              onChange={(e) =>
                                dispatch(
                                  updateAchievementField({
                                    index,
                                    field: "icon",
                                    value: e.target.value,
                                  })
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tiêu đề
                            </label>
                            <input
                              type="text"
                              value={achievement.title}
                              onChange={(e) =>
                                dispatch(
                                  updateAchievementField({
                                    index,
                                    field: "title",
                                    value: e.target.value,
                                  })
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả
                            </label>
                            <input
                              type="text"
                              value={achievement.description}
                              onChange={(e) =>
                                dispatch(
                                  updateAchievementField({
                                    index,
                                    field: "description",
                                    value: e.target.value,
                                  })
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveIntroduction}
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>Lưu</span>
                    </button>
                    <button
                      onClick={() => dispatch(setEditing(false))}
                      className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Hủy</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {quickIntroduction.title}
                    </h3>
                    <p className="text-gray-600">
                      {quickIntroduction.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Video: {quickIntroduction.videoUrl}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Thành tựu
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickIntroduction.achievements.map(
                        (achievement, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="text-3xl mb-2">
                              {achievement.icon}
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {achievement.title}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {achievement.description}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Kết nối Database
              </h2>
              <button
                onClick={handleCheckDatabase}
                disabled={checkingDatabase}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ServerIcon className="w-5 h-5" />
                <span>
                  {checkingDatabase ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                </span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              {!databaseStatus ? (
                <div className="text-center py-8 text-gray-500">
                  <ServerIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Nhấn nút &quot;Kiểm tra kết nối&quot; để kiểm tra trạng thái database</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Indicator */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      databaseStatus.connected
                        ? "bg-green-50 border-green-200"
                        : databaseStatus.status === "checking"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {databaseStatus.status === "checking" ? (
                        <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      ) : databaseStatus.connected ? (
                        <CheckIcon className="w-6 h-6 text-green-600" />
                      ) : (
                        <XMarkIcon className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <h3
                          className={`font-semibold ${
                            databaseStatus.connected
                              ? "text-green-800"
                              : databaseStatus.status === "checking"
                              ? "text-yellow-800"
                              : "text-red-800"
                          }`}
                        >
                          {databaseStatus.connected
                            ? "Kết nối thành công"
                            : databaseStatus.status === "checking"
                            ? "Đang kiểm tra..."
                            : "Kết nối thất bại"}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            databaseStatus.connected
                              ? "text-green-700"
                              : databaseStatus.status === "checking"
                              ? "text-yellow-700"
                              : "text-red-700"
                          }`}
                        >
                          {databaseStatus.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connection Details */}
                  {databaseStatus.connected && (
                    <div className="space-y-3">
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Thông tin kết nối
                        </h4>
                        <div className="space-y-2 text-sm">
                          {databaseStatus.responseTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thời gian phản hồi:</span>
                              <span className="font-mono text-gray-900">
                                {databaseStatus.responseTime}
                              </span>
                            </div>
                          )}
                          {databaseStatus.databaseInfo?.version && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phiên bản database:</span>
                              <span className="font-mono text-gray-900 text-xs">
                                {databaseStatus.databaseInfo.version.split(",")[0]}
                              </span>
                            </div>
                          )}
                          {databaseStatus.databaseUrl && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Database URL:</span>
                              <span className="font-mono text-gray-900 text-xs">
                                {databaseStatus.databaseUrl}
                              </span>
                            </div>
                          )}
                          {databaseStatus.timestamp && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thời gian kiểm tra:</span>
                              <span className="text-gray-900">
                                {new Date(databaseStatus.timestamp).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {!databaseStatus.connected && databaseStatus.status === "error" && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Chi tiết lỗi
                      </h4>
                      <div className="space-y-2 text-sm">
                        {databaseStatus.errorCode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mã lỗi:</span>
                            <span className="font-mono text-red-600">
                              {databaseStatus.errorCode}
                            </span>
                          </div>
                        )}
                        {databaseStatus.details && (
                          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-xs font-mono text-gray-700 break-all">
                              {databaseStatus.details}
                            </p>
                          </div>
                        )}
                        {databaseStatus.timestamp && (
                          <div className="flex justify-between mt-3">
                            <span className="text-gray-600">Thời gian kiểm tra:</span>
                            <span className="text-gray-900">
                              {new Date(databaseStatus.timestamp).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
