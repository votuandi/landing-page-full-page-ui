import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { POLICY_SUMMARY, TESTIMONIALS } from "@/data/solar";
import {
  FeedbackIllustration,
  InvestmentIllustration,
  PolicyIllustration,
  WarrantyIllustration,
} from "@/components/SolarIllustrations";

const investmentModels = [
  [
    "Mua đứt",
    "Doanh nghiệp sở hữu hệ thống",
    "Cao nhất",
    "Tiết kiệm điện trực tiếp",
    "Doanh nghiệp có ngân sách đầu tư",
  ],
  [
    "Trả góp",
    "Chia dòng tiền đầu tư",
    "Trung bình",
    "Giảm áp lực vốn đầu tư",
    "Cần cân đối dòng tiền",
  ],
  [
    "Thuê mái / PPA",
    "Đối tác đầu tư hệ thống",
    "Thấp / theo hợp đồng",
    "Mua điện theo thỏa thuận",
    "Mái lớn, phụ tải ổn định",
  ],
];

const warranties = [
  ["Tấm pin", "12–15 năm sản phẩm", "25–30 năm hiệu suất*"],
  ["Inverter", "5 năm tiêu chuẩn", "Có tùy chọn mở rộng*"],
  ["Pin lưu trữ", "10 năm*", "Theo điều kiện chu kỳ / dung lượng"],
  ["Thi công & mái", "Theo hợp đồng", "Tách bạch phạm vi chống dột"],
];

export default function SolarInvestmentDetails() {
  return (
    <div className="solar-investment-details">
      <section className="t5-section bg-slate-50">
        <div className="t5-container">
          <div className="solar-intro-split">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Mô hình đầu tư
              </span>
              <h2 className="t5-heading" data-reveal="left">
                Chọn cấu trúc tài chính phù hợp dòng tiền.
              </h2>
              <p
                className="t5-subheading"
                data-reveal="bottom"
                data-reveal-delay="80"
              >
                Tự đầu tư để tối đa tiết kiệm, trả góp để nhẹ dòng tiền, hoặc
                hợp tác thuê mái khi muốn hạn chế vốn ban đầu.
              </p>
            </div>
            <div
              className="solar-intro-visual"
              data-reveal="right"
              data-reveal-delay="120"
            >
              <InvestmentIllustration />
            </div>
          </div>
          <div
            className="mt-10 overflow-x-auto border border-slate-200 bg-white"
            data-reveal="bottom"
            data-reveal-delay="120"
          >
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-100 text-[var(--t5-primary)]">
                <tr>
                  {[
                    "Mô hình",
                    "Sở hữu",
                    "Vốn đầu tư ban đầu",
                    "Lợi ích chính",
                    "Phù hợp",
                  ].map((h) => (
                    <th key={h} className="p-4 font-black">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investmentModels.map((row) => (
                  <tr key={row[0]} className="border-t border-slate-200">
                    {row.map((cell, index) => (
                      <td
                        key={cell}
                        className={`p-4 ${index === 0 ? "font-black text-[var(--t5-primary)]" : "text-slate-600"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            className="mt-3 text-xs text-slate-500"
            data-reveal="bottom"
            data-reveal-delay="200"
          >
            PPA/thuê mái phụ thuộc đối tác tài chính, pháp lý và điều kiện dự
            án. [CẦN XÁC MINH]
          </p>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="t5-eyebrow" data-reveal="top">
              Bảo hành tách bạch
            </span>
            <h2 className="t5-heading" data-reveal="left">
              Biết rõ ai chịu trách nhiệm cho từng phần.
            </h2>
            <p className="t5-subheading" data-reveal="bottom">
              Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục
              có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.
            </p>
            <div
              className="solar-side-visual"
              data-reveal="zoom"
              data-reveal-delay="160"
            >
              <WarrantyIllustration />
            </div>
          </div>
          <div
            className="border border-slate-200"
            data-reveal="right"
            data-reveal-delay="100"
          >
            {warranties.map(([item, period, note], index) => (
              <div
                key={item}
                data-reveal="right"
                data-reveal-delay={160 + index * 70}
                className="grid grid-cols-[1fr_1fr] gap-4 border-b border-slate-200 p-5 last:border-0"
              >
                <div>
                  <div className="font-black text-[var(--t5-primary)]">
                    {item}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{note}</div>
                </div>
                <div className="text-right text-sm font-bold">{period}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="t5-section bg-amber-50">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <span className="t5-eyebrow" data-reveal="top">
              Chính sách mái nhà
            </span>
            <h2 className="t5-heading" data-reveal="left">
              Tóm tắt để ra quyết định, không thay thế tư vấn pháp lý.
            </h2>
            <div
              className="solar-side-visual"
              data-reveal="zoom"
              data-reveal-delay="140"
            >
              <PolicyIllustration />
            </div>
          </div>
          <div className="grid gap-3">
            {POLICY_SUMMARY.map((item) => (
              <div
                key={item}
                className="flex gap-3 border-b border-amber-200 py-4"
                data-reveal="right"
                data-reveal-delay={POLICY_SUMMARY.indexOf(item) * 70}
              >
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <p className="text-sm leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container">
          <div className="solar-intro-split">
            <div>
              <span className="t5-eyebrow" data-reveal="top">
                Khách hàng nói gì
              </span>
              <h2 className="t5-heading" data-reveal="left">
                Niềm tin đến từ cách dự án được triển khai.
              </h2>
              <p
                className="t5-subheading"
                data-reveal="bottom"
                data-reveal-delay="80"
              >
                Phản hồi từ những đơn vị đã cùng chúng tôi đi qua khảo sát, thi
                công và vận hành hệ thống.
              </p>
            </div>
            <div
              className="solar-intro-visual"
              data-reveal="zoom"
              data-reveal-delay="120"
            >
              <FeedbackIllustration />
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.company}
                className="border border-slate-200 p-7"
                data-reveal={TESTIMONIALS.indexOf(item) % 2 ? "right" : "left"}
              >
                <div className="text-sm font-black text-amber-600">
                  {item.rating}
                </div>
                <p className="mt-6 text-xl font-bold leading-8 text-[var(--t5-primary)]">
                  “{item.text}”
                </p>
                <footer className="mt-6 border-t border-slate-200 pt-4 text-sm">
                  <strong>{item.person}</strong>
                  <div className="text-slate-500">{item.company}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
