"use client";

import { useMemo, useState } from "react";
import { calculateSolar, formatMoney } from "@/utils/solar";
import { delay } from "@/utils/reveal";

type CustomerType = "household" | "business" | "manufacturing";
type Region = "north" | "central" | "south";

export default function RoiCalculator() {
  const [customerType, setCustomerType] = useState<CustomerType>("manufacturing");
  const [monthlyBill, setMonthlyBill] = useState(120000000);
  const [region, setRegion] = useState<Region>("south");
  const [daytimeUse, setDaytimeUse] = useState(90);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const result = useMemo(() => calculateSolar({ customerType, monthlyBill, region, daytimeUse }), [customerType, monthlyBill, region, daytimeUse]);
  const max = Math.max(...result.cumulative.map((v) => Math.abs(v)), 1);
  const points = result.cumulative.map((value, index) => {
    const x = 20 + (index / 24) * 560;
    const y = 190 - ((value + max * 0.1) / (max * 1.1)) * 150;
    return `${x},${Math.max(24, Math.min(194, y))}`;
  }).join(" ");

  async function requestDetail() {
    if (!phone.trim()) return;
    const response = await fetch("/api/lead", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ phone, source:"roi-calculator", message:`ROI: ${result.kwp.toFixed(1)} kWp, vốn ${formatMoney(result.investment)}, hoàn vốn ${result.paybackYears.toFixed(1)} năm` }),
    });
    if (response.ok) setSent(true);
  }

  return (
    <section id="roi" className="t8-screen t5-section bg-gradient-to-b from-bg to-bg-elevated">
      <div className="t5-container">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t5-eyebrow">Ước tính đầu tư</span>
          <h2 className="t5-heading">Biết quy mô và thời gian hoàn vốn trước khi khảo sát.</h2>
          <p className="t5-subheading">Kết quả là ước tính sơ bộ từ cùng bộ tham số cấu hình của website. Hồ sơ đầu tư chính thức cần dữ liệu phụ tải, mái và báo giá thực tế.</p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div data-reveal="left" style={delay(0.15)} className="t8-card p-6 md:p-8">
            <div className="grid gap-5">
              <label className="t5-label">Loại khách hàng
                <select value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType)} className="t5-input">
                  <option value="household">Gia đình tiêu thụ cao</option>
                  <option value="business">Kinh doanh / dịch vụ</option>
                  <option value="manufacturing">Sản xuất / nhà xưởng</option>
                </select>
              </label>
              <label className="t5-label">Tiền điện trung bình mỗi tháng
                <input type="number" min={1000000} step={1000000} value={monthlyBill} onChange={(e) => setMonthlyBill(Number(e.target.value))} className="t5-input" />
              </label>
              <label className="t5-label">Khu vực
                <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="t5-input">
                  <option value="north">Miền Bắc</option>
                  <option value="central">Miền Trung</option>
                  <option value="south">Miền Nam</option>
                </select>
              </label>
              <label className="t5-label">Tỷ lệ dùng điện ban ngày: <strong>{daytimeUse}%</strong>
                <input type="range" min={35} max={98} value={daytimeUse} onChange={(e) => setDaytimeUse(Number(e.target.value))} className="mt-3 w-full accent-accent" />
              </label>
            </div>
          </div>
          <div data-reveal="right" style={delay(0.3)} className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-bg-deep to-primary-deep p-6 text-fg shadow-[0_40px_80px_-40px_rgb(var(--c-shadow)/)] md:p-8"><div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/),transparent_65%)]" />
            <div className="relative grid gap-3 sm:grid-cols-2">
              {[
                ["Công suất đề xuất", `${result.kwp.toFixed(1)} kWp`],
                ["Vốn đầu tư ước tính", formatMoney(result.investment)],
                ["Tiết kiệm tháng đầu", formatMoney(result.monthlySaving)],
                ["Hoàn vốn ước tính", `${result.paybackYears.toFixed(1).replace(".", ",")} năm`],
              ].map(([label,value]) => <div key={label} className="t8-glass-dark rounded-2xl p-5"><div className="text-xs font-bold uppercase tracking-[.14em] text-fg-muted">{label}</div><div className="mt-2 text-2xl font-black text-accent">{value}</div></div>)}
            </div>
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between"><strong>Tiết kiệm lũy kế 25 năm</strong><span className="text-xs text-fg-muted">ước tính</span></div>
              <svg viewBox="0 0 600 210" className="w-full" role="img" aria-label="Biểu đồ tiết kiệm lũy kế 25 năm">
                <line x1="20" y1="190" x2="580" y2="190" stroke="rgb(var(--c-line) / .25)" />
                <polyline points={points} fill="none" stroke="rgb(var(--c-accent))" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                <text x="20" y="206" fill="rgb(var(--c-fg-muted))" fontSize="11">Năm 1</text>
                <text x="535" y="206" fill="rgb(var(--c-fg-muted))" fontSize="11">Năm 25</text>
              </svg>
            </div>
            <div className="mt-6 border-t border-line/15 pt-6">
              <label className="text-sm font-bold">Nhận bản tính chi tiết qua Zalo</label>
              <div className="mt-2 flex gap-2"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="min-w-0 flex-1 rounded-full bg-bg-elevated/95 px-5 py-3 text-sm text-fg outline-none" placeholder="Số điện thoại" /><button type="button" onClick={requestDetail} className="rounded-full bg-accent px-5 py-3 text-sm font-black text-primary">Nhận bản tính</button></div>
              {sent && <p className="mt-2 text-sm font-bold text-success">Đã ghi nhận yêu cầu của bạn.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}