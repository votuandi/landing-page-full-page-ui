"use client";

import React, { useEffect } from "react";
import {
  CheckIcon,
  LightBulbIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import ScrollAnimationWrapper from "@/components/ScrollAnimationWrapper";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

export default function CompanyStorySection() {
  const dispatch = useAppDispatch();
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);

  // Fetch company info on component mount
  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  const milestones = [
    {
      year: "2014",
      title: "Khởi đầu với ước mơ",
      description:
        "Thành lập với tầm nhìn phát triển năng lượng sạch tại Việt Nam",
      icon: LightBulbIcon,
    },
    {
      year: "2017",
      title: "Mở rộng quy mô",
      description:
        "Hoàn thành 100+ dự án đầu tiên và mở rộng ra các tỉnh thành",
      icon: CheckIcon,
    },
    {
      year: "2020",
      title: "Đi tiên phong",
      description:
        "Trở thành đối tác chính thức của các thương hiệu hàng đầu thế giới",
      icon: ShieldCheckIcon,
    },
    {
      year: "2024",
      title: "Vững vàng phát triển",
      description: "Hơn 1000 dự án hoàn thành với tổng công suất 50MW+",
      icon: HeartIcon,
    },
  ];

  const values = [
    {
      title: "Chất lượng",
      description:
        "Cam kết sử dụng thiết bị chính hãng, công nghệ tiên tiến nhất",
      icon: "🎯",
    },
    {
      title: "Tin cậy",
      description: "Bảo hành dài hạn và dịch vụ hỗ trợ khách hàng 24/7",
      icon: "🤝",
    },
    {
      title: "Bền vững",
      description: "Góp phần bảo vệ môi trường và xây dựng tương lai xanh",
      icon: "🌱",
    },
    {
      title: "Đổi mới",
      description: "Liên tục nghiên cứu và ứng dụng công nghệ mới nhất",
      icon: "💡",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-white to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Câu chuyện của{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
                chúng tôi
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Từ một ước mơ nhỏ về năng lượng sạch, chúng tôi đã vươn lên trở
              thành đối tác tin cậy của hàng nghìn gia đình và doanh nghiệp trên
              toàn quốc.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Main Story Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <ScrollAnimationWrapper>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Hành trình 10 năm phát triển
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {companyInfo?.companyName || "Tên Công ty"} được thành lập vào năm 2014 với sứ mệnh đưa năng
                lượng mặt trời đến gần hơn với mọi gia đình Việt Nam. Bắt đầu từ
                một team nhỏ gồm 5 thành viên đầy đam mê, chúng tôi đã không
                ngừng học hỏi, cải tiến và phát triển.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Với triết lý &quot;Chất lượng tạo nên uy tín&quot;, chúng tôi luôn đặt lợi
                ích khách hàng lên hàng đầu. Mỗi dự án được thực hiện đều được
                chúng tôi coi như ngôi nhà của chính mình, từ khâu tư vấn, thiết
                kế cho đến lắp đặt và bảo trì.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Ngày hôm nay, với hơn 1000 dự án đã hoàn thành và tổng công suất
                lắp đặt hơn 50MW, chúng tôi tự hào là một trong những đơn vị
                hàng đầu trong lĩnh vực năng lượng mặt trời tại Việt Nam.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-2xl">
                <img
                  src="/images/solar-installation-hero.jpg"
                  alt={`${companyInfo?.companyName || "Tên Công ty"} - Lắp đặt hệ thống năng lượng mặt trời`}
                  className="w-full h-80 object-cover rounded-xl mb-6"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-solar-blue">
                      1000+
                    </div>
                    <div className="text-sm text-gray-600">
                      Dự án hoàn thành
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-solar-orange">
                      50MW+
                    </div>
                    <div className="text-sm text-gray-600">Tổng công suất</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-solar-green">
                      98%
                    </div>
                    <div className="text-sm text-gray-600">Hài lòng</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-solar-yellow">
                      24/7
                    </div>
                    <div className="text-sm text-gray-600">Hỗ trợ</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* Timeline */}
        <ScrollAnimationWrapper>
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Cột mốc phát triển
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-r from-solar-blue to-primary-600 rounded-full flex items-center justify-center">
                        <milestone.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl font-bold text-solar-blue mr-4">
                          {milestone.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {milestone.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Core Values */}
        <ScrollAnimationWrapper>
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Giá trị cốt lõi
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-solar-blue to-primary-600 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Mission Statement */}
        <ScrollAnimationWrapper>
          <div className="mt-20 text-center bg-gradient-to-r from-solar-blue to-primary-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Sứ mệnh của chúng tôi</h2>
            <p className="text-xl leading-relaxed max-w-4xl mx-auto">
              &quot;{companyInfo?.mission || ""}&quot;
            </p>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
