"use client";
import { useState } from "react";
import { getAssumptions, getBrand, getCopy } from "@/content/solar";
import SegmentComparison from "./SegmentComparison";
import ProjectEvidence from "./ProjectEvidence";
import TrustLegal from "./TrustLegal";
import BillHero from "./BillHero";
import PackageCalculator from "./PackageCalculator";
import SectionHeading from "./SectionHeading";
import SolarScrollReveal from "./SolarScrollReveal";
import LeadForm from "@/components/LeadForm";
export default function SolarHome() {
  const [bill, setBill] = useState(String(getAssumptions().defaultBill));
  const copy = getCopy(),
    brand = getBrand();
  return (
    <main id="noi-dung" className="solar-home">
      <SolarScrollReveal />
      <BillHero bill={bill} setBill={setBill} />
      <section className="solar-section">
        <div className="solar-container">
          <SectionHeading
            step="01"
            label="Hiểu bài toán"
            title="Tiền điện đang lấy đi cơ hội nào?"
            answer="Chi phí điện đều đặn làm thu hẹp ngân sách cho những việc khác. Đầu tư hiệu quả bắt đầu từ việc hiểu phụ tải của chính bạn."
          />
          <div className="solar-problem-grid" data-solar-stagger="up">
            {copy.problems.map((p, i) => (
              <article key={p.title}>
                <span className="solar-index">0{i + 1}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="tinh-toan" className="solar-section solar-surface">
        <div className="solar-container">
          <SectionHeading
            step="02"
            label="Tính trước khi chọn"
            title="Hóa đơn của bạn phù hợp công suất nào?"
            answer="Công suất phù hợp phụ thuộc nơi lắp đặt và thời điểm dùng điện. Hóa đơn giúp xác định quy mô để bắt đầu cuộc trao đổi kỹ thuật."
          />
          <PackageCalculator bill={bill} setBill={setBill} />
        </div>
      </section>
      <SegmentComparison />
      <ProjectEvidence />
      <TrustLegal />
      <section className="solar-section solar-surface">
        <div className="solar-container solar-faq-grid" data-solar-stagger="up">
          <SectionHeading
            step="06"
            label="Gỡ vướng mắc"
            title="Bạn còn băn khoăn điều gì?"
            answer="Bạn có thể xem cách tính và giới hạn của mô phỏng trước khi liên hệ."
          />
          <div>
            {copy.faq.map((f) => (
              <details className="solar-accordion" key={f.question}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section id="lien-he" className="solar-section">
        <div
          className="solar-container solar-contact-grid"
          data-solar-stagger="up"
        >
          <div>
            <SectionHeading
              step="07"
              label="Bước tiếp theo"
              title="Muốn biết mái của bạn có phù hợp?"
              answer="Hãy chuẩn bị hóa đơn và ảnh mái. Một cuộc trao đổi kỹ thuật sẽ giúp làm rõ phương án khảo sát."
            />
            <p>{brand.address}</p>
            <a
              className="solar-contact-phone"
              href={`tel:${brand.hotlines[0].phone}`}
            >
              {brand.hotlines[0].phone}
            </a>
            <p className="solar-note">{copy.demoNotice}</p>
          </div>
          <div className="solar-card solar-contact-form">
            <LeadForm source="home-bottom" />
          </div>
        </div>
      </section>
    </main>
  );
}
