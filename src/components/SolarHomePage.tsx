import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoltIcon,
  SunIcon,
  ChartBarIcon,
  HomeModernIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  BellAlertIcon,
  Battery50Icon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { FAQS, PRODUCTS, PROJECTS } from "@/data/solar";
import { calculateSolar } from "@/utils/solar";
import RoiCalculator from "@/components/RoiCalculator";
import LeadForm from "@/components/LeadForm";
import SolarInvestmentDetails from "@/components/SolarInvestmentDetails";
import ScrollRevealObserver from "@/components/ScrollRevealObserver";
import {
  ContactIllustration,
  EquipmentIllustration,
  JourneyIllustration,
  QuestionIllustration,
  SolarSceneIllustration,
} from "@/components/SolarIllustrations";

// These are illustrative scenarios, using the same assumptions as the calculator.
const solutions = [
  {
    id: "nha-may",
    number: "01",
    label: "Nhà máy & nhà xưởng",
    icon: BuildingOffice2Icon,
    title: "Mái nhà tạo điện.\nNhà máy thêm lợi thế.",
    description:
      "Biến diện tích mái sẵn có thành nguồn điện phục vụ sản xuất. Thiết kế theo giờ hoạt động và phụ tải để mỗi kWh tạo ra được sử dụng hiệu quả.",
    benefits: [
      "Giảm điện mua từ lưới trong giờ sản xuất",
      "Thi công theo khu vực, phù hợp lịch vận hành",
      "Theo dõi sản lượng và chủ động lên lịch bảo trì",
    ],
    image: "/images/solar-panels-hero.jpg",
    alt: "Hệ thống pin mặt trời phủ trên mái nhà xưởng",
    href: "/service/solar-nha-xuong",
    bill: 120000000,
    daytimeUse: 45,
    customerType: "manufacturing" as const,
    context: "Nhà máy có hóa đơn 120 triệu đồng/tháng",
    color: "blue",
  },
  {
    id: "cua-hang",
    number: "02",
    label: "Cửa hàng & kinh doanh",
    icon: BuildingStorefrontIcon,
    title: "Nắng ngoài cửa.\nTiết kiệm trong quầy.",
    description:
      "Điều hòa, tủ mát và thiết bị bán hàng cần điện suốt ngày. Điện mặt trời hỗ trợ đúng khung giờ cửa hàng hoạt động, giúp tối ưu chi phí mỗi tháng.",
    benefits: [
      "Cấp điện cho thiết bị khi cửa hàng mở cửa",
      "Chọn công suất theo diện tích mái và nhu cầu",
      "Có thể bổ sung lưu trữ cho các tải thiết yếu",
    ],
    image: "/images/solar-installation-hero.jpg",
    alt: "Tấm pin mặt trời hấp thụ ánh nắng để tạo điện phục vụ kinh doanh",
    href: "/contact-us?solution=cua-hang",
    bill: 12000000,
    daytimeUse: 40,
    customerType: "business" as const,
    context: "Cửa hàng có hóa đơn 12 triệu đồng/tháng",
    color: "sand",
  },
  {
    id: "gia-dinh",
    number: "03",
    label: "Hộ gia đình",
    icon: HomeModernIcon,
    title: "Nhà đón nắng.\nCả nhà an tâm.",
    description:
      "Một mái nhà thông minh hơn, một hóa đơn nhẹ hơn. Chọn hệ hòa lưới hoặc kết hợp pin lưu trữ theo thói quen sinh hoạt của gia đình.",
    benefits: [
      "Tận dụng điện tạo ra cho sinh hoạt ban ngày",
      "Theo dõi hệ thống ngay trên điện thoại",
      "Lưu điện dùng buổi tối với cấu hình phù hợp",
    ],
    image: "/images/solar/solar-home-hero.webp",
    alt: "Ngôi nhà hiện đại với tấm pin trên mái và thiết bị lưu trữ bên hông",
    href: "/service/solar-gia-dinh",
    bill: 3000000,
    daytimeUse: 35,
    customerType: "household" as const,
    context: "Gia đình có hóa đơn 3 triệu đồng/tháng",
    color: "blue",
  },
];

const steps = [
  {
    icon: ChartBarIcon,
    title: "Khảo sát",
    text: "Đọc hóa đơn, đo phụ tải, kiểm tra mái và điều kiện thi công.",
    output: "Biên bản khảo sát & dữ liệu đầu vào",
  },
  {
    icon: SunIcon,
    title: "Thiết kế",
    text: "Mô phỏng sản lượng, chọn thiết bị và phương án đấu nối.",
    output: "Hồ sơ kỹ thuật & phương án đầu tư",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Thi công",
    text: "Chia khu vực, quản lý vật tư và kiểm soát chất lượng lắp đặt.",
    output: "Nhật ký thi công & kiểm tra an toàn",
  },
  {
    icon: ShieldCheckIcon,
    title: "Nghiệm thu",
    text: "Đo kiểm, cấu hình giám sát và hướng dẫn sử dụng hệ thống.",
    output: "Hồ sơ bàn giao & hướng dẫn vận hành",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Bảo trì",
    text: "Theo dõi hiệu suất, xử lý cảnh báo và vệ sinh định kỳ.",
    output: "Báo cáo hiệu suất & lịch bảo dưỡng",
  },
];

export default function SolarHomePage() {
  return (
    <main className="solar-home">
      <ScrollRevealObserver />
      <section className="solar-hero" aria-labelledby="hero-title">
        <div className="t5-container">
          <div className="solar-hero-panel">
            <div className="solar-hero-copy" data-reveal="left">
              <span className="solar-pill">
                <span className="solar-status-dot" /> Năng lượng sạch. Giá trị
                mỗi ngày.
              </span>
              <h1 id="hero-title">
                Đón nắng hôm nay.
                <br />
                <span>Tiết kiệm</span>
                <br />
                cho ngày mai.
              </h1>
              <p>
                Điện mặt trời cho nhà máy, cửa hàng và tổ ấm. Cùng Minwy Solar
                biến ánh nắng thành nguồn năng lượng bạn chủ động mỗi ngày.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact-us"
                  className="t5-button t5-button-primary"
                >
                  Nhận tư vấn miễn phí <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
                <a href="#giai-phap" className="t5-button solar-outline-button">
                  Khám phá giải pháp <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
              <div className="solar-hero-highlights">
                <div>
                  <strong>03</strong>
                  <span>nhóm giải pháp</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>theo dõi điện năng</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>đầu mối đồng hành</span>
                </div>
              </div>
            </div>
            <div
              className="solar-hero-visual"
              data-reveal="right"
              data-reveal-delay="120"
            >
              <div className="solar-hero-orbit" aria-hidden="true" />
              <Image
                src="/images/solar/solar-home-hero.webp"
                alt="Mô hình ngôi nhà sử dụng điện mặt trời và pin lưu trữ"
                fill
                priority
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 80vw, 55vw"
                className="solar-house-image"
              />
              <div className="solar-hotspot solar-hotspot-production">
                <span className="solar-hotspot-icon">
                  <SunIcon className="h-5 w-5" />
                </span>
                <div>
                  <span>Điện tạo ra hôm nay</span>
                  <strong>
                    28,6 <small>kWh</small>
                  </strong>
                </div>
              </div>
              <div className="solar-hotspot solar-hotspot-consumption">
                <span className="solar-hotspot-icon">
                  <BoltIcon className="h-5 w-5" />
                </span>
                <div>
                  <span>Điện đã sử dụng</span>
                  <strong>
                    19,2 <small>kWh</small>
                  </strong>
                </div>
              </div>
              <div className="solar-hotspot solar-hotspot-storage">
                <span className="solar-hotspot-icon">
                  <Battery50Icon className="h-5 w-5" />
                </span>
                <div>
                  <span>Pin lưu trữ</span>
                  <strong>
                    76<small>%</small>
                  </strong>
                </div>
              </div>
              <div className="solar-hero-caption">
                <span className="solar-status-dot" /> Hệ thống đang vận hành{" "}
                <span>• Số liệu minh họa</span>
              </div>
            </div>
          </div>
          <div
            className="solar-hero-bottom"
            data-reveal="bottom"
            data-reveal-delay="180"
          >
            <span>Giải pháp vừa vặn với công trình của bạn</span>
            <a href="#giai-phap">
              Khám phá bên dưới <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section
        id="giai-phap"
        className="t5-section solar-solutions"
        aria-labelledby="solutions-title"
      >
        <div className="t5-container">
          <div className="solar-section-intro">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Nắng cho mọi nhu cầu
              </span>
              <h2
                id="solutions-title"
                className="t5-heading"
                data-reveal="left"
              >
                Cùng một mặt trời.
                <br />
                Nhiều cách tạo giá trị.
              </h2>
            </div>
            <p
              className="t5-subheading"
              data-reveal="bottom"
              data-reveal-delay="80"
            >
              Mỗi công trình có một nhịp sử dụng điện riêng. Chúng tôi bắt đầu
              từ nhu cầu của bạn để thiết kế giải pháp phù hợp.
            </p>
          </div>
          <div
            className="solar-scene"
            data-reveal="zoom"
            data-reveal-delay="120"
          >
            <SolarSceneIllustration />
          </div>
          <div className="solar-solution-nav">
            {solutions.map(({ id, label, icon: Icon, number }) => (
              <a
                key={id}
                href={`#${id}`}
                data-reveal={number === "02" ? "top" : "bottom"}
                data-reveal-delay={Number(number) * 80}
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
                <span className="solar-nav-number">
                  {number} <ArrowUpRightIcon className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {solutions.map((solution, index) => {
        const result = calculateSolar({
          customerType: solution.customerType,
          monthlyBill: solution.bill,
          daytimeUse: solution.daytimeUse,
          region: "south",
        });
        const Icon = solution.icon;
        return (
          <section
            id={solution.id}
            key={solution.id}
            className={`t5-section solar-benefit-section solar-benefit-${solution.color} ${index === 0 ? "solar-benefit-edge" : ""}`}
            aria-labelledby={`${solution.id}-title`}
          >
            <div
              className={`t5-container solar-benefit-grid ${index % 2 ? "solar-benefit-reversed" : ""}`}
            >
              <div
                className="solar-benefit-image"
                data-reveal={index % 2 ? "right" : "left"}
              >
                <Image
                  src={solution.image}
                  alt={solution.alt}
                  fill
                  sizes={
                    index === 0 ? "100vw" : "(max-width: 1023px) 100vw, 50vw"
                  }
                  className={`object-cover ${index === 2 ? "solar-house-detail" : ""}`}
                />
                <span className="solar-image-index">
                  {solution.number} / GIẢI PHÁP
                </span>
                <div className="solar-image-note">
                  <span className="solar-note-icon">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <strong>{solution.label}</strong>
                    <span>Thiết kế theo nhu cầu thực tế</span>
                  </div>
                </div>
              </div>
              <div className="solar-benefit-copy">
                <span className="t5-eyebrow" data-reveal="top">
                  {solution.label}
                </span>
                <h2
                  id={`${solution.id}-title`}
                  className="t5-heading whitespace-pre-line"
                  data-reveal={index % 2 ? "left" : "right"}
                >
                  {solution.title}
                </h2>
                <p
                  className="t5-subheading"
                  data-reveal="bottom"
                  data-reveal-delay="80"
                >
                  {solution.description}
                </p>
                <ul className="solar-check-list">
                  {solution.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      data-reveal="bottom"
                      data-reveal-delay="100"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div
                  className="solar-savings"
                  data-reveal="bottom"
                  data-reveal-delay="180"
                >
                  <div>
                    <span>Tiết kiệm minh họa mỗi tháng</span>
                    <strong>
                      {new Intl.NumberFormat("vi-VN", {
                        maximumFractionDigits: 2,
                      }).format(result.monthlySaving / 1_000_000)}{" "}
                      triệu <small>đồng</small>
                    </strong>
                  </div>
                  <div className="solar-savings-ratio">
                    <strong>{solution.daytimeUse}%</strong>
                    <span>hóa đơn mẫu</span>
                  </div>
                </div>
                <p
                  className="solar-estimate-note"
                  data-reveal="bottom"
                  data-reveal-delay="200"
                >
                  {solution.context}. Giả định điện mặt trời thay thế{" "}
                  {solution.daytimeUse}% điện mua từ lưới, khu vực miền Nam. Kết
                  quả thực tế tùy phụ tải, diện tích mái và cấu hình; chưa tính
                  chi phí bảo trì.
                </p>
                <Link
                  href={solution.href}
                  className="solar-text-link"
                  data-reveal="bottom"
                >
                  Tư vấn giải pháp phù hợp{" "}
                  <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      <section
        id="theo-doi-dien-nang"
        className="t5-section solar-monitoring solar-full-width"
        aria-labelledby="monitoring-title"
      >
        <div className="t5-container">
          <div className="solar-monitoring-panel">
            <div className="solar-monitoring-copy" data-reveal="left">
              <span className="solar-pill">
                <DevicePhoneMobileIcon className="h-4 w-4" /> Kết nối với năng
                lượng của bạn
              </span>
              <h2 id="monitoring-title">
                Theo dõi
                <br />
                điện năng <span>24/7</span>
              </h2>
              <p>
                Mọi chỉ số năng lượng đều nằm trong tầm mắt. Từ điện tạo ra,
                điện tiêu thụ đến mức pin lưu trữ — mở ứng dụng là biết hệ thống
                đang hoạt động ra sao.
              </p>
              <div className="solar-monitor-features">
                {[
                  {
                    icon: SunIcon,
                    title: "Điện tạo ra",
                    description: "Theo dõi sản lượng theo ngày, tháng và năm.",
                  },
                  {
                    icon: BoltIcon,
                    title: "Điện tiêu thụ",
                    description: "Hiểu thói quen sử dụng để chủ động tối ưu.",
                  },
                  {
                    icon: Battery50Icon,
                    title: "Điện lưu trữ",
                    description:
                      "Xem mức pin và trạng thái sạc, xả khi có lưu trữ.",
                  },
                ].map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    data-reveal="left"
                    data-reveal-delay={160 + index * 80}
                  >
                    <span>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/contact-us?solution=giam-sat"
                className="t5-button solar-yellow-button"
              >
                Tìm hiểu ứng dụng <ArrowUpRightIcon className="h-5 w-5" />
              </Link>
              <p className="solar-monitor-note">
                Các chỉ số phụ thuộc Inverter, công tơ và cấu hình lưu trữ. Cần
                kết nối Internet để xem từ xa.
              </p>
            </div>
            <div
              className="solar-monitoring-visual"
              data-reveal="right"
              data-reveal-delay="120"
            >
              <Image
                src="/images/solar/energy-monitoring-phone.webp"
                alt="Bàn tay cầm điện thoại hiển thị ứng dụng theo dõi điện mặt trời, phía sau là màn hình tổng quan năng lượng được làm mờ"
                fill
                sizes="100vw"
                quality={88}
                className="object-cover"
              />
              <div className="solar-monitor-badge">
                <BellAlertIcon className="h-5 w-5" />
                <div>
                  <strong>Chủ động từ bất cứ đâu</strong>
                  <span>Sản lượng • Tiêu thụ • Lưu trữ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="solar-calculator">
        <RoiCalculator />
      </div>

      <section
        className="t5-section solar-expertise"
        aria-labelledby="expertise-title"
      >
        <div className="t5-container">
          <div className="solar-intro-split">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Không chỉ là lắp đặt
              </span>
              <h2
                id="expertise-title"
                className="t5-heading"
                data-reveal="left"
              >
                Một người đồng hành.
                <br />
                Suốt vòng đời hệ thống.
              </h2>
              <p
                className="t5-subheading"
                data-reveal="bottom"
                data-reveal-delay="80"
              >
                Từ buổi khảo sát đầu tiên đến từng lần bảo trì, mỗi bước đều có
                đầu ra rõ ràng để bạn theo dõi và kiểm chứng.
              </p>
              <Link
                href="/about-us"
                className="solar-text-link mt-6"
                data-reveal="bottom"
                data-reveal-delay="140"
              >
                Tìm hiểu Minwy Solar <ArrowUpRightIcon className="h-5 w-5" />
              </Link>
            </div>
            <div
              className="solar-intro-visual"
              data-reveal="right"
              data-reveal-delay="120"
            >
              <JourneyIllustration />
            </div>
          </div>
          <div className="solar-step-track" data-reveal="left" aria-hidden="true">
            {steps.map(({ title }) => (
              <span key={title} />
            ))}
          </div>
          <div className="solar-expertise-cards">
            {steps.map(({ icon: Icon, title, text, output }, index) => (
              <article
                key={title}
                data-reveal={index % 2 ? "top" : "bottom"}
                data-reveal-delay={index * 70}
              >
                <div className="flex items-center justify-between">
                  <span className="solar-feature-icon">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="solar-step-output">{output}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SolarInvestmentDetails />

      <section
        className="t5-section solar-projects solar-full-width"
        aria-labelledby="projects-title"
      >
        <div className="t5-container">
          <div className="solar-section-intro">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Công trình & câu chuyện
              </span>
              <h2 id="projects-title" className="t5-heading" data-reveal="left">
                Những mái nhà đã đón nắng.
              </h2>
            </div>
            <p
              className="t5-subheading"
              data-reveal="bottom"
              data-reveal-delay="80"
            >
              Các dự án minh họa giúp bạn hình dung quy mô, cấu hình và hiệu quả
              của từng giải pháp.
            </p>
          </div>
          <div className="solar-project-grid">
            {PROJECTS.map((project) => (
              <Link
                key={project.slug}
                href={`/project/${project.slug}`}
                className="solar-project-card group"
                data-reveal="bottom"
                data-reveal-delay={PROJECTS.indexOf(project) * 100}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="solar-project-tag">{project.capacity}</span>
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold text-slate-500">
                    {project.type} • {project.location}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-[var(--t5-primary)]">
                    {project.title}
                  </h3>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-sm text-slate-600">
                      Khám phá công trình
                    </span>
                    <ArrowUpRightIcon className="h-5 w-5 text-[var(--t5-primary)]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="solar-brands" aria-labelledby="brands-title">
        <div className="t5-container">
          <div className="solar-intro-split">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Thiết bị trong danh mục mẫu
              </span>
              <h2 id="brands-title" className="t5-heading" data-reveal="left">
                Thiết bị tốt.
                <br />
                Nền tảng bền vững.
              </h2>
              <p
                className="t5-subheading"
                data-reveal="bottom"
                data-reveal-delay="80"
              >
                Khám phá tấm pin, Inverter, pin lưu trữ và phụ kiện để chọn cấu
                hình phù hợp cho công trình.
              </p>
            </div>
            <div
              className="solar-intro-visual"
              data-reveal="zoom"
              data-reveal-delay="120"
            >
              <EquipmentIllustration />
            </div>
          </div>
          <div className="solar-brand-grid">
            {Array.from(new Set(PRODUCTS.map((p) => p.brand))).map(
              (brand, index) => (
                <Link
                  href={`/product?brand=${encodeURIComponent(brand)}`}
                  key={brand}
                  data-reveal={index % 2 ? "top" : "bottom"}
                  data-reveal-delay={index * 45}
                >
                  <span>{brand}</span>
                  <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="t5-section solar-faq" aria-labelledby="faq-title">
        <div className="t5-container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="t5-eyebrow" data-reveal="top">
              Giải đáp cùng bạn
            </span>
            <h2 id="faq-title" className="t5-heading" data-reveal="left">
              Bắt đầu từ
              <br />
              những điều cần rõ.
            </h2>
            <p
              className="t5-subheading"
              data-reveal="bottom"
              data-reveal-delay="80"
            >
              Hiểu hệ thống trước khi đầu tư để chọn đúng giải pháp cho công
              trình.
            </p>
            <div
              className="solar-side-visual"
              data-reveal="zoom"
              data-reveal-delay="160"
            >
              <QuestionIllustration />
            </div>
          </div>
          <div className="solar-faq-list">
            {FAQS.map(([q, a]) => (
              <details
                key={q}
                data-reveal="right"
                data-reveal-delay={
                  FAQS.findIndex(([question]) => question === q) * 40
                }
              >
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a.replace("Calculator", "Công cụ ước tính")}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        className="t5-section solar-contact"
        aria-labelledby="contact-title"
      >
        <div className="t5-container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="solar-pill" data-reveal="top">
              <SunIcon className="h-4 w-4" /> Bắt đầu hành trình năng lượng sạch
            </span>
            <h2 id="contact-title" className="t5-heading" data-reveal="left">
              Mái nhà của bạn.
              <br />
              Cơ hội của ngày mai.
            </h2>
            <p
              className="t5-subheading"
              data-reveal="bottom"
              data-reveal-delay="80"
            >
              Chia sẻ hóa đơn điện và nhu cầu sử dụng. Chúng tôi sẽ cùng bạn tìm
              một phương án vừa vặn, rõ chi phí và dễ vận hành.
            </p>
            <div
              className="mt-7 flex items-center gap-3 text-sm font-semibold text-[var(--t5-primary)]"
              data-reveal="bottom"
              data-reveal-delay="120"
            >
              <ShieldCheckIcon className="h-6 w-6" /> Tư vấn rõ ràng từ thiết kế
              đến bảo hành
            </div>
            <div
              className="solar-side-visual"
              data-reveal="zoom"
              data-reveal-delay="180"
            >
              <ContactIllustration />
            </div>
          </div>
          <div
            className="solar-contact-form"
            data-reveal="right"
            data-reveal-delay="120"
          >
            <LeadForm source="solar-home" />
          </div>
        </div>
      </section>
    </main>
  );
}
