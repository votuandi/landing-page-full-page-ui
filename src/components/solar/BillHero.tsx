"use client";
import { ArrowDownIcon, SunIcon, BoltIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { getAssumptions, getBrand, getCopy, getPricing, getPvout } from "@/content/solar";
import { estimate, money, number, packagesForBill } from "@/lib/solar-calc";
export default function BillHero({ bill, setBill }: { bill: string; setBill: (value: string) => void }) {
  const a = getAssumptions(), brand = getBrand(), copy = getCopy();
  const province = getPvout().find(p => p.id === a.defaultProvince)!;
  const value = Number(bill), valid = Number.isFinite(value) && value > 0;
  const pkg = valid ? packagesForBill(getPricing(), value, "money", a)[0] : null;
  const result = pkg ? estimate(pkg, province, a) : null;
  return <section className="solar-hero"><div className="solar-container solar-hero-grid">
    <div className="solar-hero-message"><div className="solar-kicker"><SunIcon />{copy.eyebrow}</div><h1>{copy.heroTitle}<span>Hãy để nắng tạo giá trị.</span></h1><p className="solar-hero-description">{copy.heroDescription}</p>
      <div className="solar-hero-stats"><div><strong>{getPvout().length}</strong><span>Tỉnh để tra sản lượng</span></div><div><strong>{getPricing().length}</strong><span>Gói mẫu để đối chiếu</span></div><div><strong>{number(a.pr * 100, 0)}%</strong><span>Hệ số PR giả định</span></div></div>
      <p className="solar-hero-signature">{brand.slogan}</p>
    </div>
    <div className="solar-hero-tool"><div className="solar-tool-top"><span><BoltIcon /> Bắt đầu từ hóa đơn</span><span className="solar-status">Mô phỏng</span></div>
      <h2>Hóa đơn điện của bạn bao nhiêu?</h2><p>Nhập tiền điện một tháng để thấy điểm khởi đầu.</p>
      <label className="solar-label" htmlFor="hero-bill">Tiền điện / tháng (đồng)</label><input id="hero-bill" className="solar-input solar-bill-input" type="number" inputMode="numeric" min="1" value={bill} onChange={e => setBill(e.target.value)} aria-describedby="hero-estimate" />
      <div className="solar-estimate" id="hero-estimate" aria-live="polite">{result && pkg ? <><span>Phương án hòa lưới tham khảo</span><strong>{number(pkg.kwp)} kWp</strong><div>Tiết kiệm mô phỏng {money(result.monthlySaving)} / tháng</div></> : <p>Nhập số tiền lớn hơn 0 để tính thử.</p>}</div>
      <a href="#tinh-toan" className="solar-button solar-button-accent">So sánh gói cho hóa đơn này <ArrowDownIcon /></a><p className="solar-note">Mặc định {province.name}; bạn có thể đổi tỉnh và đơn vị ở bộ tính đầy đủ. Giá và sản lượng là dữ liệu mẫu.</p>
      <div className="solar-tool-bottom"><SunIcon /><span>Hiểu dòng tiền trước khi chọn thiết bị.</span><ArrowUpRightIcon /></div>
    </div>
  </div></section>;
}
