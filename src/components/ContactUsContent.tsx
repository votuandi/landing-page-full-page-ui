"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SITE_CONFIG, SOCIAL_LINKS, SERVICES } from "@/utils/constants";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchOffices, Office } from "@/lib/features/offices/officesSlice";

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
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const { offices, loading: officesLoading } = useAppSelector((state) => state.offices);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    phone: "",
    email: "",
    consultationType: "",
    specificItem: "",
    details: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [productsFromDB, setProductsFromDB] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch offices on component mount
  useEffect(() => {
    dispatch(fetchOffices({ limit: 100 })); // Fetch all offices
  }, [dispatch]);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        // Fetch all active products
        const response = await fetch("/api/products?isActive=true&limit=1000");
        if (response.ok) {
          const data = await response.json();
          const products = data.data || [];
          setProductsFromDB(
            products.map((p: any) => ({
              id: p.id,
              title: p.title,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Set default office to main office or first office
  useEffect(() => {
    if (offices.length > 0 && !selectedOffice) {
      const mainOffice = offices.find((office) => office.isMainOffice);
      setSelectedOffice(mainOffice || offices[0]);
    }
  }, [offices, selectedOffice]);

  // Handle URL params for product purchase
  useEffect(() => {
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const amount = searchParams.get("amount");

    if (type === "product" && productId && amount && !hasAutoFilled) {
      // Fetch product information
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (response.ok) {
            const product = await response.json();
            const productTitle = product.title || "";
            const productIdNum = parseInt(productId);

            // Ensure the product is in the productsFromDB list using functional update
            setProductsFromDB((prev) => {
              const productExists = prev.some((p) => p.id === productIdNum);
              if (!productExists && productTitle) {
                return [...prev, { id: productIdNum, title: productTitle }];
              }
              return prev;
            });

            setFormData((prev) => ({
              ...prev,
              consultationType: "Sản phẩm",
              specificItem: productTitle,
              details: `Tôi muốn mua ${amount} sản phẩm.`,
            }));
            setHasAutoFilled(true);

            // Scroll to form after a short delay to ensure form is rendered
            setTimeout(() => {
              if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 100);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      };

      fetchProduct();
    }
  }, [searchParams, hasAutoFilled]);

  const validatePhone = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    // Vietnamese phone numbers: 10-11 digits
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(cleanPhone);
  };

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

    // Validate phone number in real-time
    if (name === "phone") {
      if (value && !validatePhone(value)) {
        setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.");
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number before submission
    if (!validatePhone(formData.phone)) {
      setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.");
      // Scroll to phone input
      const phoneInput = document.getElementById("phone");
      if (phoneInput) {
        phoneInput.focus();
        phoneInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    setPhoneError(""); // Clear any previous errors

    try {
      const response = await fetch("/api/contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check if error is related to phone validation
        if (errorData.error && errorData.error.includes("phone")) {
          setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.");
          setIsSubmitting(false);
          return;
        }
        throw new Error(errorData.error || "Failed to submit form");
      }

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
      setPhoneError("");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert(
        "Đã có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua số điện thoại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSpecificOptions = () => {
    if (formData.consultationType === "Sản phẩm") {
      // Use products from database if available, otherwise fallback to static list
      if (productsFromDB.length > 0) {
        return productsFromDB.map((p) => p.title);
      }
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

        {/* Office Selector Dropdown */}
        {offices.length > 1 && (
          <div className="mb-6">
            <label
              htmlFor="office-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Chọn văn phòng
            </label>
            <select
              id="office-select"
              value={selectedOffice?.id || ""}
              onChange={(e) => {
                const office = offices.find(
                  (o) => o.id === parseInt(e.target.value)
                );
                if (office) setSelectedOffice(office);
              }}
              className="w-full max-w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={officesLoading}
            >
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                  {office.isMainOffice ? " (Văn phòng chính)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Address Section & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Thông tin liên hệ
              </h2>
              {selectedOffice?.isMainOffice && (
                <span className="px-3 py-1 bg-orange-200 text-amber-800 shadow-sm text-sm font-medium rounded-full">
                  Văn phòng chính
                </span>
              )}
            </div>

            {isMounted && officesLoading && !selectedOffice ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedOffice ? (
              <div className="space-y-6">
                {/* Office Name */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedOffice.name}
                  </h3>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Điện thoại</p>
                    <a
                      href={`tel:${selectedOffice.phone}`}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {selectedOffice.phone}
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
                      href={`mailto:${selectedOffice.email}`}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {selectedOffice.email}
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
                    <p className="text-gray-600">{selectedOffice.address}</p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="border-t pt-6">
                  <p className="font-medium text-gray-900 mb-2">Giờ làm việc</p>
                  <p className="text-gray-600">{selectedOffice.workingTime}</p>
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
            ) : (
              <div className="text-center py-12 text-gray-500">
                Không có thông tin văn phòng
              </div>
            )}
          </div>

          {/* Google Map */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-full min-h-[400px]">
              {selectedOffice?.googleMapEmbedUrl ? (
                <iframe
                  src={selectedOffice.googleMapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "400px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Vị trí ${selectedOffice.name}`}
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100">
                  <div className="text-center text-gray-500">
                    <MapPinIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Chưa có thông tin bản đồ</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div ref={formRef} className="bg-white rounded-lg shadow-lg p-8">
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${phoneError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                    }`}
                  placeholder="Nhập số điện thoại (10-11 chữ số)"
                />
                {phoneError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {phoneError}
                  </p>
                )}
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
                  {getSpecificOptions().map((item, index) => (
                    <option key={index} value={item}>
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
