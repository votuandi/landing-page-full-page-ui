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
import CompanyInfoForm from "@/components/CompanyInfoForm";
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
  updateField,
  updateTitle,
  updateDescription,
  updateVideoUrl,
  fetchHeroContent,
  saveHeroContent,
  uploadHeroVideo,
} from "@/lib/features/introduction/introductionSlice";
import { checkDatabaseConnection } from "@/lib/features/database/databaseSlice";
import {
  fetchPartners,
  createPartner,
  updatePartner,
  deletePartner,
  setEditingPartner,
  addNewPartner,
  updateLocalPartner,
} from "@/lib/features/partners/partnersSlice";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"banners" | "introduction" | "database" | "partners" | "companyInfo">(
    "banners"
  );
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Partner image upload state
  const [selectedPartnerImage, setSelectedPartnerImage] = useState<{ [key: number]: File }>({});
  const [uploadingPartnerImage, setUploadingPartnerImage] = useState<{ [key: number]: boolean }>({});
  const [partnerImagePreview, setPartnerImagePreview] = useState<{ [key: number]: string }>({});

  // Redux state
  const dispatch = useAppDispatch();
  const { banners, loading, error, editingBannerId } = useAppSelector((state) => state.banners);
  const { data: heroContent, isEditing: editingIntroduction, loading: loadingHero } = useAppSelector(
    (state) => state.introduction
  );
  const { status: databaseStatus, checking: checkingDatabase } = useAppSelector(
    (state) => state.database
  );
  const { partners, loading: loadingPartners, error: partnersError, editingPartnerId } = useAppSelector(
    (state) => state.partners
  );

  // Fetch banners, hero content, and partners on mount
  useEffect(() => {
    dispatch(fetchBanners());
    dispatch(fetchHeroContent());
    dispatch(fetchPartners());
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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        setUploadError(`Kích thước file vượt quá giới hạn. Tối đa 500MB. File của bạn: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        setSelectedVideoFile(null);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        setUploadError('Vui lòng chọn file video hợp lệ');
        setSelectedVideoFile(null);
        return;
      }

      setUploadError(null);
      setSelectedVideoFile(file);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedVideoFile) return;

    setUploadingVideo(true);
    setUploadError(null);

    try {
      await dispatch(uploadHeroVideo(selectedVideoFile)).unwrap();
      alert("Upload video thành công!");
      setSelectedVideoFile(null);
      // Reset the file input
      const fileInput = document.getElementById('video-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể upload video. Vui lòng thử lại.";
      setUploadError(errorMessage);
      alert(errorMessage);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveIntroduction = async () => {
    try {
      await dispatch(saveHeroContent(heroContent)).unwrap();
      alert("Lưu thành công!");
    } catch (err) {
      alert("Không thể lưu. Vui lòng thử lại.");
    }
  };

  const handleCheckDatabase = () => {
    dispatch(checkDatabaseConnection());
  };

  // Partner handlers
  const handleAddPartner = () => {
    dispatch(addNewPartner());
  };

  const handleDeletePartner = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đối tác này?")) {
      return;
    }

    try {
      await dispatch(deletePartner(id)).unwrap();
      // Clean up image states
      const newSelectedImages = { ...selectedPartnerImage };
      const newUploadingImages = { ...uploadingPartnerImage };
      const newPreviewImages = { ...partnerImagePreview };
      delete newSelectedImages[id];
      delete newUploadingImages[id];
      delete newPreviewImages[id];
      setSelectedPartnerImage(newSelectedImages);
      setUploadingPartnerImage(newUploadingImages);
      setPartnerImagePreview(newPreviewImages);
    } catch (err) {
      alert("Không thể xóa đối tác. Vui lòng thử lại.");
    }
  };

  const handlePartnerImageChange = (partnerId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, WebP, GIF)');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`Kích thước file vượt quá giới hạn 10MB. File của bạn: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPartnerImagePreview(prev => ({
          ...prev,
          [partnerId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      // Store file
      setSelectedPartnerImage(prev => ({
        ...prev,
        [partnerId]: file
      }));
    }
  };

  const handleUploadPartnerImage = async (partnerId: number): Promise<string | null> => {
    const file = selectedPartnerImage[partnerId];
    if (!file) return null;

    setUploadingPartnerImage(prev => ({ ...prev, [partnerId]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/partners/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      // Clear the selected file and preview after successful upload
      const newSelectedImages = { ...selectedPartnerImage };
      const newPreviewImages = { ...partnerImagePreview };
      delete newSelectedImages[partnerId];
      delete newPreviewImages[partnerId];
      setSelectedPartnerImage(newSelectedImages);
      setPartnerImagePreview(newPreviewImages);

      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setUploadingPartnerImage(prev => ({ ...prev, [partnerId]: false }));
    }
  };

  const handleSavePartner = async (id: number) => {
    const partner = partners.find((p) => p.id === id);
    if (!partner) return;

    try {
      const isNewPartner = id === 0;
      const order = partners.indexOf(partner);

      // Upload image if a new file is selected
      let imageUrl = partner.image;
      if (selectedPartnerImage[id]) {
        const uploadedUrl = await handleUploadPartnerImage(id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          // Update local state with new image URL
          dispatch(updateLocalPartner({
            ...partner,
            image: imageUrl
          }));
        } else {
          alert('Không thể upload ảnh. Vui lòng thử lại.');
          return;
        }
      }

      // Validate required fields
      if (!partner.name || !imageUrl) {
        alert('Vui lòng điền đầy đủ tên đối tác và chọn ảnh');
        return;
      }

      if (isNewPartner) {
        await dispatch(
          createPartner({
            name: partner.name,
            image: imageUrl,
            order,
            isActive: partner.isActive,
          })
        ).unwrap();
      } else {
        await dispatch(
          updatePartner({
            id,
            partner: {
              name: partner.name,
              image: imageUrl,
              order,
              isActive: partner.isActive,
            },
          })
        ).unwrap();
      }

      alert('Lưu đối tác thành công!');
    } catch (err) {
      alert("Không thể lưu đối tác. Vui lòng thử lại.");
    }
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
                ${activeTab === "banners"
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
                ${activeTab === "introduction"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Giới thiệu nhanh
            </button>
            <button
              onClick={() => setActiveTab("partners")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "partners"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Đối tác
            </button>
            <button
              onClick={() => setActiveTab("companyInfo")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "companyInfo"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Thông tin công ty
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "database"
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
                                  className={`px-2 py-1 rounded ${banner.isActive
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
              {loadingHero ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : editingIntroduction ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={heroContent.title}
                      onChange={(e) => dispatch(updateTitle(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Giải pháp Năng lượng Mặt trời hàng đầu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={heroContent.description}
                      onChange={(e) => dispatch(updateDescription(e.target.value))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Chuyên phân phối thiết bị năng lượng mặt trời..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Video
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={heroContent.videoUrl}
                        onChange={(e) => dispatch(updateVideoUrl(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="/videos/hero_video.mp4"
                        disabled
                      />

                      <div className="border-t border-gray-200 pt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Hoặc chọn file video từ thiết bị (tối đa 500MB)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            id="video-file-input"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            disabled={uploadingVideo}
                          />
                          {selectedVideoFile && (
                            <button
                              onClick={handleUploadVideo}
                              disabled={uploadingVideo}
                              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {uploadingVideo ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Đang tải...</span>
                                </>
                              ) : (
                                <>
                                  <CheckIcon className="w-4 h-4" />
                                  <span>Upload</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {selectedVideoFile && (
                          <p className="mt-2 text-xs text-gray-600">
                            File đã chọn: {selectedVideoFile.name} ({(selectedVideoFile.size / (1024 * 1024)).toFixed(2)}MB)
                          </p>
                        )}
                        {uploadError && (
                          <p className="mt-2 text-xs text-red-600">
                            {uploadError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Thống kê
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={heroContent.stat1Value}
                          onChange={(e) => dispatch(updateField({ field: 'stat1Value', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="10+"
                        />
                        <input
                          type="text"
                          value={heroContent.stat1Label}
                          onChange={(e) => dispatch(updateField({ field: 'stat1Label', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Năm kinh nghiệm"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={heroContent.stat2Value}
                          onChange={(e) => dispatch(updateField({ field: 'stat2Value', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="1000+"
                        />
                        <input
                          type="text"
                          value={heroContent.stat2Label}
                          onChange={(e) => dispatch(updateField({ field: 'stat2Label', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Dự án hoàn thành"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={heroContent.stat3Value}
                          onChange={(e) => dispatch(updateField({ field: 'stat3Value', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="24/7"
                        />
                        <input
                          type="text"
                          value={heroContent.stat3Label}
                          onChange={(e) => dispatch(updateField({ field: 'stat3Label', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Hỗ trợ kỹ thuật"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Tính năng nổi bật (bên cạnh video)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Tính năng 1</label>
                        <input
                          type="text"
                          value={heroContent.feature1Title}
                          onChange={(e) => dispatch(updateField({ field: 'feature1Title', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Thân thiện"
                        />
                        <input
                          type="text"
                          value={heroContent.feature1Description}
                          onChange={(e) => dispatch(updateField({ field: 'feature1Description', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Thân thiện môi trường"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Tính năng 2</label>
                        <input
                          type="text"
                          value={heroContent.feature2Title}
                          onChange={(e) => dispatch(updateField({ field: 'feature2Title', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Tiết kiệm điện"
                        />
                        <input
                          type="text"
                          value={heroContent.feature2Description}
                          onChange={(e) => dispatch(updateField({ field: 'feature2Description', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Lên đến 90%"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveIntroduction}
                      disabled={loadingHero}
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>{loadingHero ? 'Đang lưu...' : 'Lưu'}</span>
                    </button>
                    <button
                      onClick={() => dispatch(setEditing(false))}
                      disabled={loadingHero}
                      className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {heroContent.title}
                    </h3>
                    <p className="text-gray-600">
                      {heroContent.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Video: {heroContent.videoUrl}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Thống kê
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {heroContent.stat1Value}
                        </div>
                        <p className="text-sm text-gray-600">
                          {heroContent.stat1Label}
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {heroContent.stat2Value}
                        </div>
                        <p className="text-sm text-gray-600">
                          {heroContent.stat2Label}
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {heroContent.stat3Value}
                        </div>
                        <p className="text-sm text-gray-600">
                          {heroContent.stat3Label}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Tính năng nổi bật
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-1">
                          {heroContent.feature1Title}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {heroContent.feature1Description}
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-1">
                          {heroContent.feature2Title}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {heroContent.feature2Description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "partners" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quản lý Đối tác
              </h2>
              <button
                onClick={handleAddPartner}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Thêm Đối tác</span>
              </button>
            </div>

            {partnersError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {partnersError}
              </div>
            )}

            {loadingPartners ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải...
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có đối tác nào. Nhấn &quot;Thêm Đối tác&quot; để tạo đối tác mới.
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  {editingPartnerId === partner.id ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên đối tác
                        </label>
                        <input
                          type="text"
                          value={partner.name}
                          onChange={(e) =>
                            dispatch(
                              updateLocalPartner({
                                ...partner,
                                name: e.target.value,
                              })
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Tên đối tác"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hình ảnh đối tác
                        </label>

                        {/* Image Preview */}
                        {(partnerImagePreview[partner.id] || partner.image) && (
                          <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <img
                              src={partnerImagePreview[partner.id] || partner.image}
                              alt={partner.name || "Preview"}
                              className="max-h-24 mx-auto object-contain"
                            />
                          </div>
                        )}

                        {/* File Upload */}
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={(e) => handlePartnerImageChange(partner.id, e)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            disabled={uploadingPartnerImage[partner.id]}
                          />
                          <p className="text-xs text-gray-500">
                            Chọn ảnh từ thiết bị (JPEG, PNG, WebP, GIF - tối đa 10MB)
                            <br />
                            Ảnh sẽ tự động chuyển đổi sang WebP khi lưu
                          </p>
                          {selectedPartnerImage[partner.id] && (
                            <p className="text-xs text-green-600">
                              ✓ Đã chọn: {selectedPartnerImage[partner.id].name}
                            </p>
                          )}
                        </div>

                        {/* Manual URL Input (Optional) */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <label className="block text-xs text-gray-600 mb-1">
                            Hoặc nhập URL thủ công
                          </label>
                          <input
                            type="text"
                            value={partner.image}
                            onChange={(e) =>
                              dispatch(
                                updateLocalPartner({
                                  ...partner,
                                  image: e.target.value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="/images/partners/logo.png"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`active-${partner.id}`}
                          checked={partner.isActive}
                          onChange={(e) =>
                            dispatch(
                              updateLocalPartner({
                                ...partner,
                                isActive: e.target.checked,
                              })
                            )
                          }
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`active-${partner.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Hiển thị
                        </label>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleSavePartner(partner.id)}
                          disabled={uploadingPartnerImage[partner.id]}
                          className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPartnerImage[partner.id] ? (
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
                            dispatch(setEditingPartner(null));
                            // Clear image states for this partner
                            const newSelectedImages = { ...selectedPartnerImage };
                            const newPreviewImages = { ...partnerImagePreview };
                            delete newSelectedImages[partner.id];
                            delete newPreviewImages[partner.id];
                            setSelectedPartnerImage(newSelectedImages);
                            setPartnerImagePreview(newPreviewImages);
                          }}
                          disabled={uploadingPartnerImage[partner.id]}
                          className="flex-1 flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>Hủy</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-32 bg-gray-100 flex items-center justify-center p-4">
                        {partner.image ? (
                          <img
                            src={partner.image}
                            alt={partner.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <PhotoIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {partner.name || "Chưa có tên"}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded ${partner.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {partner.isActive ? "Hiển thị" : "Ẩn"}
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => dispatch(setEditingPartner(partner.id))}
                            className="flex-1 p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5 mx-auto" />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner.id)}
                            className="flex-1 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
                    className={`p-4 rounded-lg border-2 ${databaseStatus.connected
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
                          className={`font-semibold ${databaseStatus.connected
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
                          className={`text-sm mt-1 ${databaseStatus.connected
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

        {activeTab === "companyInfo" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Thông tin công ty
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Quản lý thông tin chi tiết về công ty, bao gồm logo, slogan, hành trình phát triển, và các thông tin khác.
              </p>
            </div>

            <CompanyInfoForm />
          </div>
        )}
      </div>
    </div>
  );
}
