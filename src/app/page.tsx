import Image from "next/image";
import Link from "next/link";
import Section from "@/components/template/Section";
import { HOME_CONTENT as content } from "@/data/home";
import { allProductsData } from "@/data/products";
import { SITE_CONFIG } from "@/utils/constants";
import { pageMetadata } from "@/utils/seo";
export const metadata = pageMetadata(
  "Giải pháp điện mặt trời cho gia đình & doanh nghiệp",
  SITE_CONFIG.description,
  "/",
);
export default function Home() {
  const products = [17, 1, 9].map((id) =>
    allProductsData.find((item) => item.id === id)!,
  );
  return (
    <main>
      <section className="home-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1>
              {content.headline}
              <br />
              <span>{content.highlight}</span>
            </h1>
            <p className="hero-description">{content.description}</p>
            <div className="hero-actions">
              <Link href="/contact-us" className="button button-dark">
                Tư vấn giải pháp <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/product" className="text-link">
                Khám phá sản phẩm <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hero-note">
              <span className="sun-dot" aria-hidden="true">
                ☀
              </span>
              <p>
                Nguồn năng lượng từ thiên nhiên.
                <br />
                <strong>Giải pháp dành riêng cho bạn.</strong>
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <Image
              src={content.image}
              alt="Hệ thống tấm pin năng lượng mặt trời"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 50vw"
              className="hero-photo"
            />
            <div className="image-caption">
              <span>ĐIỆN MẶT TRỜI ÁP MÁI</span>
              <strong>
                Nắng hôm nay.
                <br />
                Năng lượng ngày mai.
              </strong>
            </div>
            <div className="hero-badge" aria-hidden="true">
              SOLAR
              <br />
              <span>☀</span>
              <br />
              ENERGY
            </div>
          </div>
        </div>
      </section>
      <div className="benefit-strip">
        <div className="shell">
          <span>Tư vấn theo nhu cầu</span>
          <span>Thiết bị phù hợp</span>
          <span>Lắp đặt đồng bộ</span>
          <span>Hỗ trợ sau bàn giao</span>
        </div>
      </div>
      <Section
        id="solutions"
        eyebrow="01 / GIẢI PHÁP CỦA MINWY"
        title="Một nguồn năng lượng. Nhiều khả năng."
        description="Bắt đầu từ nhu cầu thực tế để tìm giải pháp phù hợp với không gian và cách bạn sử dụng điện."
      >
        <div className="solution-grid">
          {content.solutions.map((item) => (
            <Link href={item.href} className="solution-card" key={item.number}>
              <div className="card-photo">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
              </div>
              <div className="card-copy">
                <span className="card-number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="text-link">
                  Xem giải pháp <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
      <Section
        eyebrow="02 / THIẾT BỊ NĂNG LƯỢNG"
        title="Kết nối một hệ thống hoàn chỉnh."
        description="Tấm pin, biến tần và lưu trữ năng lượng — những thành phần quan trọng cho hệ thống điện mặt trời."
        tone="soft"
      >
        <div className="equipment-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="equipment-card"
            >
              <div className="equipment-photo">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
              </div>
              <p className="eyebrow">{product.category}</p>
              <h3>{product.name}</h3>
              <p>{product.specs.slice(0, 2).join(" · ")}</p>
              <span className="text-link">
                Chi tiết sản phẩm <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="section-action">
          <Link href="/product" className="button button-outline">
            Xem tất cả sản phẩm ↗
          </Link>
        </div>
      </Section>
      <Section
        eyebrow="03 / CÁCH CHÚNG TÔI LÀM VIỆC"
        title="Từ ý tưởng đến năng lượng thực tế."
        tone="dark"
      >
        <div className="process-grid">
          {content.steps.map((step, index) => (
            <div key={step.title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section
        eyebrow="04 / CÂU HỎI THƯỜNG GẶP"
        title="Bạn hỏi. Minwy giải đáp."
      >
        <div className="faq-list">
          {content.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>
      <section className="contact-banner">
        <div className="shell">
          <div>
            <p className="eyebrow">SẴN SÀNG CHO MỘT KHỞI ĐẦU XANH?</p>
            <h2>Cùng Minwy đón nguồn năng lượng mới.</h2>
          </div>
          <a href={`tel:${SITE_CONFIG.phone}`} className="button button-dark">
            Gọi {SITE_CONFIG.phoneDisplay} ↗
          </a>
        </div>
      </section>
    </main>
  );
}
