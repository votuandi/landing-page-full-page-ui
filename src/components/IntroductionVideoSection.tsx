/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import ScrollAnimationWrapper from "@/components/ScrollAnimationWrapper";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

export default function IntroductionVideoSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);

  // Fetch company info on component mount
  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  const achievementIcons = ["🏆", "⭐", "🤝", "🔧"];
  const achievements = companyInfo?.achievements?.map((achievement, index) => ({
    icon: achievementIcons[index],
    title: achievement.title,
    description: achievement.detail,
  }));
  const whyChooseUsIcons = ["🎯", "🤝", "🌱", "💡"];
  const whyChooseUs = companyInfo?.whyChooseUs?.map((whyChooseUs, index) => ({
    icon: whyChooseUsIcons[index],
    title: whyChooseUs.title,
    description: whyChooseUs.detail,
  }));

  const teamHighlights = companyInfo?.team?.map((team, index) => ({
    title: team.title,
    description: team.detail,
    count: team.amount,
  }));

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Khám phá{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
                {companyInfo?.companyName || "Tên Công ty"}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Xem video giới thiệu để hiểu rõ hơn về công ty, đội ngũ và quy
              trình làm việc chuyên nghiệp của chúng tôi.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Video Section */}
        <ScrollAnimationWrapper>
          <div className="relative mb-20">
            <div className="relative mx-auto max-w-5xl">
              {/* Video Thumbnail */}
              <video className="w-full h-full object-cover rounded-2xl" controls poster="/images/solar-panels-hero.jpg">
                <source src="/videos/hero_video.mp4" type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Achievements Grid */}
        <ScrollAnimationWrapper>
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Thành tựu & Chứng nhận
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {achievements?.map((achievement, index) => (
                <div
                  key={index}
                  className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {achievement.icon}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">
                    {achievement.title}
                  </h4>
                  <p className="text-gray-600">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Team Highlights */}
        <ScrollAnimationWrapper>
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Đội ngũ chuyên nghiệp
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamHighlights?.map((team, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-solar-blue to-primary-600 p-6 rounded-2xl text-white text-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-3xl font-bold mb-2">{team.count}</div>
                  <h4 className="text-lg font-semibold mb-3">{team.title}</h4>
                  <p className="text-sm opacity-90">{team.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Why Choose Us */}
        <ScrollAnimationWrapper>
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Tại sao chọn {companyInfo?.companyName || "Tên Công ty"}?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Tư vấn miễn phí
                </h4>
                <p className="text-gray-600">
                  Khảo sát và tư vấn thiết kế hệ thống hoàn toàn miễn phí, không
                  phát sinh chi phí ẩn.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Lắp đặt nhanh
                </h4>
                <p className="text-gray-600">
                  Quy trình lắp đặt chuyên nghiệp, nhanh chóng với cam kết hoàn
                  thành đúng tiến độ.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Bảo hành dài hạn
                </h4>
                <p className="text-gray-600">
                  Bảo hành sản phẩm lên đến 25 năm, bảo trì và hỗ trợ kỹ thuật
                  trọn đời.
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl aspect-video">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
              {/* Placeholder for actual video */}
              <video
                className="w-full h-full rounded-lg"
                controls
                autoPlay
                poster="/images/solar-panels-hero.jpg"
              >
                <source src="/videos/hero_video.mp4" type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
