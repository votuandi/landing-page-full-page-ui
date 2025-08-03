"use client";

import React, { useState } from "react";
import { WarrantyRegistration, WarrantyLookup } from "@/types";

export default function WarrantySection() {
  const [activeSubTab, setActiveSubTab] = useState<"register" | "lookup">(
    "register"
  );
  const [registrationForm, setRegistrationForm] =
    useState<WarrantyRegistration>({
      productCode: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      purchaseDate: "",
      installationDate: "",
      address: "",
      notes: "",
    });
  const [lookupForm, setLookupForm] = useState<WarrantyLookup>({
    searchTerm: "",
    searchType: "productCode",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage(
        "Đăng ký bảo hành thành công! Mã bảo hành của bạn là: WR" + Date.now()
      );
      setRegistrationForm({
        productCode: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        purchaseDate: "",
        installationDate: "",
        address: "",
        notes: "",
      });
    }, 2000);
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage(
        "Đã tìm thấy thông tin bảo hành cho: " + lookupForm.searchTerm
      );
    }, 1500);
  };

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sub Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveSubTab("register")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === "register"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Đăng ký bảo hành</span>
                </span>
              </button>
              <button
                onClick={() => setActiveSubTab("lookup")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === "lookup"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Tra cứu bảo hành</span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        {submitMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {submitMessage}
                </p>
              </div>
              <button
                onClick={() => setSubmitMessage("")}
                className="ml-auto pl-3"
              >
                <svg
                  className="w-4 h-4 text-green-400 hover:text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeSubTab === "register" ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Đăng ký bảo hành sản phẩm
              </h3>
              <p className="text-gray-600">
                Vui lòng điền đầy đủ thông tin để đăng ký bảo hành cho sản phẩm
                của bạn.
              </p>
            </div>

            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="productCode"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mã sản phẩm *
                  </label>
                  <input
                    type="text"
                    id="productCode"
                    required
                    value={registrationForm.productCode}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        productCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mã sản phẩm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    required
                    value={registrationForm.customerName}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerPhone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    required
                    value={registrationForm.customerPhone}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        customerPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    required
                    value={registrationForm.customerEmail}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        customerEmail: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="purchaseDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ngày mua hàng *
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    required
                    value={registrationForm.purchaseDate}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        purchaseDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="installationDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ngày lắp đặt
                  </label>
                  <input
                    type="date"
                    id="installationDate"
                    value={registrationForm.installationDate}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        installationDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ lắp đặt *
                </label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={registrationForm.address}
                  onChange={(e) =>
                    setRegistrationForm({
                      ...registrationForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ chi tiết"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ghi chú
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={registrationForm.notes}
                  onChange={(e) =>
                    setRegistrationForm({
                      ...registrationForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Thông tin bổ sung (không bắt buộc)"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Đang xử lý..." : "Đăng ký bảo hành"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Tra cứu thông tin bảo hành
              </h3>
              <p className="text-gray-600">
                Nhập thông tin để tra cứu tình trạng bảo hành sản phẩm của bạn.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="searchType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tìm kiếm theo
                </label>
                <select
                  id="searchType"
                  value={lookupForm.searchType}
                  onChange={(e) =>
                    setLookupForm({
                      ...lookupForm,
                      searchType: e.target.value as
                        | "productCode"
                        | "phone"
                        | "email",
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white transition-all duration-300 text-gray-700 font-medium shadow-sm hover:shadow-md cursor-pointer"
                >
                  <option value="productCode">Mã sản phẩm</option>
                  <option value="phone">Số điện thoại</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="searchTerm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Thông tin tìm kiếm
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  required
                  value={lookupForm.searchTerm}
                  onChange={(e) =>
                    setLookupForm({ ...lookupForm, searchTerm: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    lookupForm.searchType === "productCode"
                      ? "Nhập mã sản phẩm"
                      : lookupForm.searchType === "phone"
                      ? "Nhập số điện thoại"
                      : "Nhập địa chỉ email"
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Đang tìm kiếm..." : "Tra cứu"}
                </button>
              </div>
            </form>

            {/* Sample warranty information display */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Hướng dẫn tra cứu:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Mã sản phẩm: Thường được in trên nhãn sản phẩm hoặc hóa đơn
                  mua hàng
                </li>
                <li>
                  • Số điện thoại: Số điện thoại đã đăng ký khi mua sản phẩm
                </li>
                <li>• Email: Địa chỉ email đã sử dụng khi đăng ký bảo hành</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
