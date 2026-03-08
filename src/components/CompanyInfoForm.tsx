"use client";

import { useState, useEffect } from "react";
import {
  PhotoIcon,
  VideoCameraIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchCompanyInfo,
  updateCompanyInfo,
  uploadLogo,
  uploadStoryImage,
  uploadStoryVideo,
  updateLocalField,
  StoryItem,
  Milestone,
  CoreValue,
  Achievement,
  WhyChooseUs,
  TeamMember,
} from "@/lib/features/companyInfo/companyInfoSlice";

export default function CompanyInfoForm() {
  const dispatch = useAppDispatch();
  const {
    data: companyInfo,
    loading,
    saving,
    uploadingLogo,
    uploadingStoryImage,
    uploadingStoryVideo,
    error,
  } = useAppSelector((state) => state.companyInfo);

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedStoryImageFile, setSelectedStoryImageFile] = useState<File | null>(null);
  const [selectedStoryVideoFile, setSelectedStoryVideoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  const handleFieldChange = (field: string, value: any) => {
    dispatch(updateLocalField({ field: field as any, value }));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (selectedLogoFile) {
      await dispatch(uploadLogo(selectedLogoFile));
      setSelectedLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleStoryImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedStoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoryImageUpload = async () => {
    if (selectedStoryImageFile) {
      await dispatch(uploadStoryImage(selectedStoryImageFile));
      setSelectedStoryImageFile(null);
      setStoryImagePreview(null);
    }
  };

  const handleStoryVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedStoryVideoFile(file);
    }
  };

  const handleStoryVideoUpload = async () => {
    if (selectedStoryVideoFile) {
      await dispatch(uploadStoryVideo(selectedStoryVideoFile));
      setSelectedStoryVideoFile(null);
    }
  };

  const handleSave = async () => {
    if (companyInfo) {
      await dispatch(updateCompanyInfo(companyInfo));
      alert("Đã lưu thông tin công ty thành công!");
    }
  };

  // Array field handlers
  const addStoryItem = () => {
    const currentItems = companyInfo?.storyItems || [];
    handleFieldChange("storyItems", [
      ...currentItems,
      { title: "", detail: "" },
    ]);
  };

  const updateStoryItem = (index: number, field: keyof StoryItem, value: string) => {
    const items = [...(companyInfo?.storyItems || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("storyItems", items);
  };

  const removeStoryItem = (index: number) => {
    const items = [...(companyInfo?.storyItems || [])];
    items.splice(index, 1);
    handleFieldChange("storyItems", items);
  };

  const addMilestone = () => {
    const currentItems = companyInfo?.milestones || [];
    handleFieldChange("milestones", [
      ...currentItems,
      { time: "", title: "", detail: "" },
    ]);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const items = [...(companyInfo?.milestones || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("milestones", items);
  };

  const removeMilestone = (index: number) => {
    const items = [...(companyInfo?.milestones || [])];
    items.splice(index, 1);
    handleFieldChange("milestones", items);
  };

  const updateCoreValue = (index: number, field: keyof CoreValue, value: string) => {
    const items = [...(companyInfo?.coreValues || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("coreValues", items);
  };

  const addAchievement = () => {
    const currentItems = companyInfo?.achievements || [];
    handleFieldChange("achievements", [
      ...currentItems,
      { title: "", detail: "" },
    ]);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const items = [...(companyInfo?.achievements || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("achievements", items);
  };

  const removeAchievement = (index: number) => {
    const items = [...(companyInfo?.achievements || [])];
    items.splice(index, 1);
    handleFieldChange("achievements", items);
  };

  const addWhyChooseUs = () => {
    const currentItems = companyInfo?.whyChooseUs || [];
    handleFieldChange("whyChooseUs", [
      ...currentItems,
      { title: "", detail: "" },
    ]);
  };

  const updateWhyChooseUs = (index: number, field: keyof WhyChooseUs, value: string) => {
    const items = [...(companyInfo?.whyChooseUs || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("whyChooseUs", items);
  };

  const removeWhyChooseUs = (index: number) => {
    const items = [...(companyInfo?.whyChooseUs || [])];
    items.splice(index, 1);
    handleFieldChange("whyChooseUs", items);
  };

  const addTeamMember = () => {
    const currentItems = companyInfo?.team || [];
    handleFieldChange("team", [
      ...currentItems,
      { amount: "", title: "", detail: "" },
    ]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const items = [...(companyInfo?.team || [])];
    items[index] = { ...items[index], [field]: value };
    handleFieldChange("team", items);
  };

  const removeTeamMember = (index: number) => {
    const items = [...(companyInfo?.team || [])];
    items.splice(index, 1);
    handleFieldChange("team", items);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Không tìm thấy thông tin công ty</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin cơ bản
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên công ty
            </label>
            <input
              type="text"
              value={companyInfo.companyName || ""}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slogan
            </label>
            <input
              type="text"
              value={companyInfo.slogan || ""}
              onChange={(e) => handleFieldChange("slogan", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo công ty (tối đa 5MB)
            </label>
            <div className="flex items-start space-x-4">
              {(logoPreview || companyInfo.logoUrl) && (
                <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={logoPreview || companyInfo.logoUrl || ""}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {selectedLogoFile && (
                  <button
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {uploadingLogo ? "Đang tải lên..." : "Tải lên"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journey/Story Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hành trình phát triển
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              value={companyInfo.storyTitle || ""}
              onChange={(e) => handleFieldChange("storyTitle", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung chi tiết
            </label>
            <textarea
              value={companyInfo.storyDetail || ""}
              onChange={(e) => handleFieldChange("storyDetail", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Story Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh hành trình
            </label>
            <div className="flex items-start space-x-4">
              {(storyImagePreview || companyInfo.storyImageUrl) && (
                <div className="w-48 h-32 border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={storyImagePreview || companyInfo.storyImageUrl || ""}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStoryImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {selectedStoryImageFile && (
                  <button
                    onClick={handleStoryImageUpload}
                    disabled={uploadingStoryImage}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {uploadingStoryImage ? "Đang tải lên..." : "Tải lên"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Story Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video giới thiệu (tối đa 1GB)
            </label>
            <div className="space-y-2">
              {companyInfo.storyVideoUrl && (
                <div className="text-sm text-gray-600">
                  Video hiện tại: {companyInfo.storyVideoUrl}
                </div>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={handleStoryVideoSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedStoryVideoFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedStoryVideoFile.name} ({(selectedStoryVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    onClick={handleStoryVideoUpload}
                    disabled={uploadingStoryVideo}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {uploadingStoryVideo ? "Đang tải lên..." : "Tải lên"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Story Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Các mục hành trình (4 items)
              </label>
              <button
                onClick={addStoryItem}
                className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
            <div className="space-y-3">
              {(companyInfo.storyItems || []).map((item, index) => (
                <div key={index} className="border border-gray-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Mục {index + 1}
                    </span>
                    <button
                      onClick={() => removeStoryItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Tiêu đề"
                      value={item.title}
                      onChange={(e) => updateStoryItem(index, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <textarea
                      placeholder="Chi tiết"
                      value={item.detail}
                      onChange={(e) => updateStoryItem(index, "detail", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Cột mốc phát triển
          </h3>
          <button
            onClick={addMilestone}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Thêm cột mốc</span>
          </button>
        </div>

        <div className="space-y-3">
          {(companyInfo.milestones || []).map((milestone, index) => (
            <div key={index} className="border border-gray-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Cột mốc {index + 1}
                </span>
                <button
                  onClick={() => removeMilestone(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Thời gian (VD: 2020)"
                  value={milestone.time}
                  onChange={(e) => updateMilestone(index, "time", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Chi tiết"
                  value={milestone.detail}
                  onChange={(e) => updateMilestone(index, "detail", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Values */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Giá trị cốt lõi (4 items)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => {
            const value = (companyInfo.coreValues || [])[index] || { title: "", detail: "" };
            return (
              <div key={index} className="border border-gray-200 bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Giá trị {index + 1}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Tiêu đề"
                    value={value.title}
                    onChange={(e) => updateCoreValue(index, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <textarea
                    placeholder="Chi tiết"
                    value={value.detail}
                    onChange={(e) => updateCoreValue(index, "detail", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sứ mệnh
        </h3>

        <textarea
          value={companyInfo.mission || ""}
          onChange={(e) => handleFieldChange("mission", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Thành tựu
          </h3>
          <button
            onClick={addAchievement}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Thêm thành tựu</span>
          </button>
        </div>

        <div className="space-y-3">
          {(companyInfo.achievements || []).map((achievement, index) => (
            <div key={index} className="border border-gray-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Thành tựu {index + 1}
                </span>
                <button
                  onClick={() => removeAchievement(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={achievement.title}
                  onChange={(e) => updateAchievement(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <textarea
                  placeholder="Chi tiết"
                  value={achievement.detail}
                  onChange={(e) => updateAchievement(index, "detail", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Đội ngũ
          </h3>
          <button
            onClick={addTeamMember}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </div>

        <div className="space-y-3">
          {(companyInfo.team || []).map((member, index) => (
            <div key={index} className="border border-gray-200 bg-pink-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mục {index + 1}
                </span>
                <button
                  onClick={() => removeTeamMember(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Số lượng (VD: 50+)"
                  value={member.amount}
                  onChange={(e) => updateTeamMember(index, "amount", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={member.title}
                  onChange={(e) => updateTeamMember(index, "title", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Chi tiết"
                  value={member.detail}
                  onChange={(e) => updateTeamMember(index, "detail", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tại sao chọn chúng tôi
          </h3>
          <button
            onClick={addWhyChooseUs}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Thêm mục</span>
          </button>
        </div>

        <div className="space-y-3">
          {(companyInfo.whyChooseUs || []).map((item, index) => (
            <div key={index} className="border border-gray-200 bg-purple-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mục {index + 1}
                </span>
                <button
                  onClick={() => removeWhyChooseUs(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={item.title}
                  onChange={(e) => updateWhyChooseUs(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <textarea
                  placeholder="Chi tiết"
                  value={item.detail}
                  onChange={(e) => updateWhyChooseUs(index, "detail", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mạng xã hội
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="text"
              value={companyInfo.facebook || ""}
              onChange={(e) => handleFieldChange("facebook", e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zalo
            </label>
            <input
              type="text"
              value={companyInfo.zalo || ""}
              onChange={(e) => handleFieldChange("zalo", e.target.value)}
              placeholder="Số điện thoại Zalo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube
            </label>
            <input
              type="text"
              value={companyInfo.youtube || ""}
              onChange={(e) => handleFieldChange("youtube", e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok
            </label>
            <input
              type="text"
              value={companyInfo.tiktok || ""}
              onChange={(e) => handleFieldChange("tiktok", e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="text"
              value={companyInfo.instagram || ""}
              onChange={(e) => handleFieldChange("instagram", e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
        >
          {saving ? "Đang lưu..." : "Lưu thông tin"}
        </button>
      </div>
    </div>
  );
}
