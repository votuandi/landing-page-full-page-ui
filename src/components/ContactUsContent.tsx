"use client";

import { useState } from "react";
import { SITE_CONFIG, SOCIAL_LINKS, SERVICES } from "@/utils/constants";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

// Product categories from ProductSection component
const productCategories = {
  "Biến Tần Inverter": [
    "Biến Tần Growatt MIN 3000TL-XE",
    "Biến Tần Huawei SUN2000-5KTL-L1",
    "Biến Tần SolarEdge SE7600H-RWS",
    "Biến Tần Fronius Symo 8.2-3-M",
    "Biến Tần ABB UNO-DM-6.0-TL-PLUS",
    "Biến Tần Sungrow SG10RT",
    "Biến Tần SMA Sunny Boy 6.0",
    "Biến Tần GoodWe GW10K-DT",
  ],
  "Pin Lưu Trữ Lithium": [
    "Pin Lithium Pylontech US3000C",
    "Pin Lithium BYD Battery-Box Premium LVS",
    "Pin Lithium Tesla Powerwall 2",
    "Pin Lithium Huawei LUNA2000-5kWh",
    "Pin Lithium LG Chem RESU10H",
    "Pin Lithium Sonnen eco 8",
    "Pin Lithium Alpha ESS SMILE5",
  ],
  "Tấm Pin Năng Lượng Mặt Trời": [
    "Tấm Pin Monocrystalline 450W",
    "Tấm Pin Polycrystalline 400W",
    "Tấm Pin Bifacial 500W",
    "Tấm Pin Half-Cell 480W",
    "Tấm Pin PERC 460W",
    "Tấm Pin Flexible 120W",
  ],
  "Inverter Luxpower": [
    "Luxpower SNA 5000 Hybrid Inverter",
    "Luxpower LXP 3600 ACS Inverter",
    "Luxpower SNA 8000 Three Phase",
    "Luxpower LXP 6000 ACS",
    "Luxpower SNA 10K Hybrid",
    "Luxpower LXP 12K ACS Pro",
    "Luxpower SNA 15K Commercial",
    "Luxpower LXP 20K Enterprise",
  ],
};

const allProducts = Object.values(productCategories).flat();

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  consultationType: "Sản phẩm" | "Dịch vụ" | "";
  specificItem: string;
  details: string;
}

export default function ContactUsContent() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    phone: "",
    email: "",
    consultationType: "",
    specificItem: "",
    details: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset specific item when consultation type changes
      ...(name === "consultationType" ? { specificItem: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    alert(
      "Cảm ơn bạn đã gửi thông tin! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất."
    );

    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      consultationType: "",
      specificItem: "",
      details: "",
    });

    setIsSubmitting(false);
  };

  const getSpecificOptions = () => {
    if (formData.consultationType === "Sản phẩm") {
      return allProducts;
    } else if (formData.consultationType === "Dịch vụ") {
      return SERVICES.map((service) => service.title);
    }
    return [];
  };

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case "facebook":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case "youtube":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case "tiktok":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ và tư vấn miễn phí về các giải pháp
            năng lượng mặt trời phù hợp với nhu cầu của bạn.
          </p>
        </div>

        {/* Address Section & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Thông tin liên hệ
            </h2>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <PhoneIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Điện thoại</p>
                  <a
                    href={`tel:${SITE_CONFIG.phone}`}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {SITE_CONFIG.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {SITE_CONFIG.email}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <MapPinIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Địa chỉ</p>
                  <p className="text-gray-600">{SITE_CONFIG.address}</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="border-t pt-6">
                <p className="font-medium text-gray-900 mb-2">Giờ làm việc</p>
                <p className="text-gray-600">{SITE_CONFIG.workingHours}</p>
              </div>

              {/* Social Media */}
              <div className="border-t pt-6">
                <p className="font-medium text-gray-900 mb-4">
                  Kết nối với chúng tôi
                </p>
                <div className="flex space-x-4">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                      title={social.name}
                    >
                      {getSocialIcon(social.icon)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-full min-h-[400px]">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3924.8269!2d${SITE_CONFIG.coordinates.lng}!3d${SITE_CONFIG.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDIxJzQzLjciTiAxMDXCsDMxJzEzLjUiRQ!5e0!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí Trọng Tín Solar"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Để lại thông tin cần tư vấn, chúng tôi sẽ liên hệ ngay
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Họ và tên *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nhập địa chỉ email"
                />
              </div>

              {/* Consultation Type */}
              <div>
                <label
                  htmlFor="consultationType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cần tư vấn về *
                </label>
                <select
                  id="consultationType"
                  name="consultationType"
                  required
                  value={formData.consultationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Chọn loại tư vấn</option>
                  <option value="Sản phẩm">Sản phẩm</option>
                  <option value="Dịch vụ">Dịch vụ</option>
                </select>
              </div>
            </div>

            {/* Specific Product/Service */}
            {formData.consultationType && (
              <div>
                <label
                  htmlFor="specificItem"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {formData.consultationType === "Sản phẩm"
                    ? "Sản phẩm cụ thể"
                    : "Dịch vụ cụ thể"}
                </label>
                <select
                  id="specificItem"
                  name="specificItem"
                  value={formData.specificItem}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">
                    {formData.consultationType === "Sản phẩm"
                      ? "Chọn sản phẩm"
                      : "Chọn dịch vụ"}
                  </option>
                  {getSpecificOptions().map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Details */}
            <div>
              <label
                htmlFor="details"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nội dung chi tiết
              </label>
              <textarea
                id="details"
                name="details"
                rows={5}
                value={formData.details}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                placeholder="Nhập chi tiết về yêu cầu tư vấn của bạn (công suất, diện tích, ngân sách, v.v.)"
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    Gửi thông tin tư vấn
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
