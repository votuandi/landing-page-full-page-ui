"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  HomeIcon,
  PhoneIcon,
  SunIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import ScrollAnimationWrapper from "@/components/ScrollAnimationWrapper";
import { SITE_CONFIG, STATISTICS } from "@/utils/constants";

const packages = [
  { name: "Home 3 kWp", price: "45 triệu", fit: "Hộ 2–4 người", saving: "1,1–1,6 triệu/tháng", specs: ["6 tấm pin hiệu suất cao", "Inverter hòa lưới 3 kW", "Giám sát qua ứng dụng"] },
  { name: "Home 5 kWp", price: "68 triệu", fit: "Gia đình dùng điện nhiều", saving: "1,8–2,6 triệu/tháng", specs: ["10 tấm pin hiệu suất cao", "Inverter 5 kW", "Tủ bảo vệ AC/DC"] },
  { name: "Hybrid 10 kWp", price: "165 triệu", fit: "Nhà ở / cửa hàng cần dự phòng", saving: "3,6–5,2 triệu/tháng", specs: ["Hệ hybrid 10 kW", "Pin lưu trữ 10 kWh", "Backup tải ưu tiên"] },
];

const projects = [
  { title: "Nhà xưởng An Phát", location: "Bình Dương", capacity: "320 kWp", saving: "~78 triệu/tháng", image: "/images/news-1.jpg" },
  { title: "Biệt thự Riverside", location: "TP. Hồ Chí Minh", capacity: "12 kWp", saving: "~4,8 triệu/tháng", image: "/images/news-2.jpg" },
  { title: "Kho lạnh Minh Thành", location: "Long An", capacity: "180 kWp", saving: "~43 triệu/tháng", image: "/images/news-4.jpg" },
];

const faqs = [
  ["Lắp điện mặt trời bao lâu thì hoàn vốn?", "Tùy mức tiêu thụ, tỷ lệ tự dùng và khu vực nắng. Với hệ được thiết kế đúng tải, thời gian tham khảo thường khoảng 4–7 năm."],
  ["Mái tôn có lắp được không?", "Có. Đội kỹ thuật sẽ khảo sát kết cấu, hướng mái, điểm bắt rail và phương án chống thấm trước khi chốt thiết kế."],
  ["Mất điện thì hệ solar có dùng được không?", "Hệ hòa lưới tiêu chuẩn sẽ dừng để bảo đảm an toàn. Nếu cần điện dự phòng, nên chọn hệ hybrid có pin lưu trữ."],
  ["Có bảo hành và theo dõi sau lắp đặt không?", "Có. Thiết bị có chính sách bảo hành theo hãng, hệ thống được bàn giao kèm giám sát sản lượng và lịch bảo trì khuyến nghị."],
];

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}

export default function HomeExperience() {
  const [bill, setBill] = useState(3000000);
  const [customerType, setCustomerType] = useState<"home" | "business">("home");
  const [region, setRegion] = useState<"bac" | "trung" | "nam">("nam");
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);

  const calculation = useMemo(() => {
    const rate = customerType === "home" ? SITE_CONFIG.calculator.averageResidentialRate : SITE_CONFIG.calculator.averageBusinessRate;
    const usage = Math.max(bill, 0) / rate;
    const sunHours = SITE_CONFIG.calculator.regionalSunHours[region];
    const selfUse = customerType === "home" ? SITE_CONFIG.calculator.selfUseRatioResidential : SITE_CONFIG.calculator.selfUseRatioBusiness;
    const targetSolarKwh = usage * selfUse;
    const kwp = Math.max(3, Math.round((targetSolarKwh / (sunHours * 30 * 0.82)) * 10) / 10);
    const cost = kwp * SITE_CONFIG.calculator.systemCostPerKwp;
    const monthlySaving = Math.min(bill * selfUse, kwp * sunHours * 30 * 0.82 * rate);
    const paybackYears = cost / Math.max(monthlySaving * 12, 1);
    return { usage, kwp, cost, monthlySaving, paybackYears };
  }, [bill, customerType, region]);

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main className="overflow-hidden bg-[var(--solar-white)] text-[var(--solar-primary-dark)]">
      <section className="relative isolate overflow-hidden bg-[var(--solar-primary-dark)] text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(color-mix(in srgb,var(--solar-white) 8%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in srgb,var(--solar-white) 8%,transparent)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-left" duration={900}>
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--solar-primary)]"><SunIcon className="h-4 w-4" /> Solar engineering cho Việt Nam</div>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Giảm tiền điện hôm nay. <span className="text-[var(--solar-primary)]">Chủ động năng lượng</span> nhiều năm tới.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-emerald-50/75">Từ thiết bị chính hãng đến khảo sát, thiết kế và thi công trọn gói — một hệ thống solar được tính theo nhu cầu thật, không bán cấu hình dư.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#calculator" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--solar-primary)] px-6 py-4 font-black text-[var(--solar-primary-dark)] transition hover:-translate-y-0.5">Tính tiền tiết kiệm <ArrowRightIcon className="h-5 w-5" /></a>
                <a href="#quote" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10">Nhận báo giá miễn phí</a>
              </div>
            </div>
          </ScrollAnimationWrapper>
          <ScrollAnimationWrapper animation="fade-in-right" delay={120} duration={1000}>
            <div className="relative">
              <div className="relative aspect-square overflow-hidden border border-white/15 bg-white/5 p-2"><Image src="/images/solar-panels-hero.jpg" alt="Hệ thống điện mặt trời áp mái" fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 48vw" /><div className="absolute inset-0 bg-gradient-to-t from-[var(--solar-primary-dark)]/65 via-transparent to-transparent" /></div>
              <div className="absolute -bottom-6 left-4 right-4 grid grid-cols-3 border border-emerald-950/10 bg-white text-[var(--solar-primary-dark)] shadow-2xl sm:left-10 sm:right-auto sm:w-[480px]">{[["Hóa đơn","4,2 triệu"],["Đề xuất","8 kWp"],["Tiết kiệm","2,9 triệu"]].map(([label,value]) => <div key={label} className="border-r border-emerald-950/10 p-4 last:border-r-0"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div><div className="mt-1 text-lg font-black text-[var(--solar-primary-dark)]">{value}</div></div>)}</div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </section>

      <section className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATISTICS.map((item,index) => <ScrollAnimationWrapper key={item.label} animation="fade-in-up" delay={index*90} className="border-b border-r border-emerald-950/10 p-6 last:border-r-0 lg:border-b-0"><div className="text-3xl font-black tracking-tight text-[var(--solar-primary-dark)]">{item.value}</div><div className="mt-1 text-sm font-semibold text-slate-500">{item.label}</div></ScrollAnimationWrapper>)}
        </div>
      </section>

      <section id="calculator" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-down"><div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Ước tính nhanh</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Hóa đơn của bạn có thể giảm bao nhiêu?</h2><p className="mt-5 text-lg leading-8 text-slate-600">Nhập vài thông tin cơ bản để có một cấu hình tham khảo trước khi kỹ sư khảo sát thực tế.</p></div></ScrollAnimationWrapper>
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <ScrollAnimationWrapper animation="slide-in-left"><div className="border border-emerald-950/10 bg-white p-6 md:p-8"><label className="text-sm font-black text-slate-700">Tiền điện mỗi tháng</label><input type="number" min={0} step={100000} value={bill} onChange={(e)=>setBill(Number(e.target.value)||0)} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-[var(--solar-primary-dark)]" /><div className="mt-7 grid grid-cols-2 gap-3">{([["home","Hộ gia đình"],["business","Kinh doanh"]] as const).map(([value,label]) => <button key={value} type="button" onClick={()=>setCustomerType(value)} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${customerType===value?"border-[var(--solar-primary-dark)] bg-[var(--solar-primary-dark)] text-white":"border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}</div><label className="mt-7 block text-sm font-black text-slate-700">Khu vực</label><select value={region} onChange={(e)=>setRegion(e.target.value as "bac"|"trung"|"nam")} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[var(--solar-primary-dark)]"><option value="bac">Miền Bắc</option><option value="trung">Miền Trung</option><option value="nam">Miền Nam</option></select></div></ScrollAnimationWrapper>
            <ScrollAnimationWrapper animation="slide-in-right" delay={100}><div className="h-full bg-[var(--solar-primary-dark)] p-6 text-white md:p-8"><div className="text-xs font-black uppercase tracking-[0.15em] text-[var(--solar-primary)]">Cấu hình tham khảo</div><div className="mt-7 grid grid-cols-2 gap-px bg-white/10">{[["Điện tiêu thụ", `${formatVnd(calculation.usage)} kWh/tháng`],["Công suất đề xuất", `${calculation.kwp} kWp`],["Đầu tư ước tính", `${formatVnd(calculation.cost)} đ`],["Tiết kiệm/tháng", `${formatVnd(calculation.monthlySaving)} đ`]].map(([label,value])=><div key={label} className="bg-[var(--solar-primary-dark)] p-4"><div className="text-xs text-emerald-100/60">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>)}</div><div className="mt-7 flex items-end justify-between border-t border-white/15 pt-6"><div><div className="text-sm text-emerald-100/70">Hoàn vốn ước tính</div><div className="mt-1 text-4xl font-black text-[var(--solar-primary)]">{calculation.paybackYears.toFixed(1)} năm</div></div><a href="#quote" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[var(--solar-primary-dark)]">Nhận báo giá</a></div><p className="mt-5 text-xs leading-5 text-emerald-100/55">Kết quả mang tính tham khảo, chưa bao gồm điều kiện mái, bóng che, biểu giá cụ thể và cấu hình lưu trữ.</p></div></ScrollAnimationWrapper>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-up"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Combo trọn gói</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Bắt đầu từ cấu hình dễ hiểu</h2></div><Link href="/product" className="font-black text-[var(--solar-primary-dark)]">Xem toàn bộ thiết bị →</Link></div></ScrollAnimationWrapper>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{packages.map((item,index)=><ScrollAnimationWrapper key={item.name} animation="fade-in-up" delay={index*120} className="h-full"><article className="flex h-full flex-col border border-emerald-950/10 bg-[var(--solar-white)] p-7 transition hover:-translate-y-1 hover:border-emerald-700/30"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.fit}</div><h3 className="mt-3 text-2xl font-black">{item.name}</h3><div className="mt-6 text-sm text-slate-500">Giá từ</div><div className="text-3xl font-black text-[var(--solar-primary-dark)]">{item.price}</div><div className="mt-2 text-sm font-bold text-[var(--solar-primary-dark)]">{item.saving}</div><ul className="mt-7 space-y-3">{item.specs.map(x=><li key={x} className="flex gap-2 text-sm text-slate-600"><CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--solar-primary-dark)]" />{x}</li>)}</ul><a href="#quote" className="mt-8 inline-flex items-center justify-between border-t border-emerald-950/10 pt-5 font-black text-[var(--solar-primary-dark)]">Nhận cấu hình chi tiết <ArrowRightIcon className="h-5 w-5" /></a></article></ScrollAnimationWrapper>)}</div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-down"><div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Giải pháp theo nhu cầu</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Không có một cấu hình đúng cho tất cả</h2></div></ScrollAnimationWrapper>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ScrollAnimationWrapper animation="slide-in-left"><article className="border border-emerald-950/10 bg-white p-7"><HomeIcon className="h-9 w-9 text-[var(--solar-primary-dark)]" /><h3 className="mt-7 text-2xl font-black">Hộ gia đình</h3><p className="mt-3 leading-7 text-slate-600">Giảm hóa đơn, tăng chủ động, ưu tiên thẩm mỹ và vận hành đơn giản.</p></article></ScrollAnimationWrapper>
            <ScrollAnimationWrapper animation="fade-in-up" delay={90}><article className="border border-emerald-950/10 bg-white p-7"><BuildingOffice2Icon className="h-9 w-9 text-[var(--solar-primary-dark)]" /><h3 className="mt-7 text-2xl font-black">Doanh nghiệp – nhà xưởng</h3><p className="mt-3 leading-7 text-slate-600">Tối ưu điện ban ngày, theo dõi ROI và bảo đảm tiêu chuẩn kỹ thuật.</p></article></ScrollAnimationWrapper>
            <ScrollAnimationWrapper animation="slide-in-right" delay={180}><article className="border border-emerald-950/10 bg-white p-7"><WrenchScrewdriverIcon className="h-9 w-9 text-[var(--solar-primary-dark)]" /><h3 className="mt-7 text-2xl font-black">Đại lý – thợ thi công</h3><p className="mt-3 leading-7 text-slate-600">Nguồn thiết bị, tư vấn cấu hình, tài liệu kỹ thuật và hỗ trợ sau bán.</p></article></ScrollAnimationWrapper>
          </div>
        </div>
      </section>

      <section className="bg-[var(--solar-primary-dark)] py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <ScrollAnimationWrapper animation="slide-in-left"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary)]">Quy trình kỹ thuật</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Từ mái nhà đến hệ thống vận hành ổn định</h2><p className="mt-5 text-lg leading-8 text-emerald-50/65">Mỗi bước có đầu ra rõ ràng để khách hàng hiểu mình đang đầu tư vào điều gì.</p></div></ScrollAnimationWrapper>
            <div className="space-y-px bg-white/10">{[["01","Khảo sát","Mái, phụ tải, hướng nắng, bóng che và nhu cầu sử dụng."],["02","Thiết kế","Cấu hình công suất, thiết bị, sơ đồ điện và dự toán sản lượng."],["03","Thi công","Lắp đặt kết cấu, DC/AC, chống sét và kiểm tra an toàn."],["04","Nghiệm thu","Đo kiểm, bàn giao ứng dụng giám sát và hướng dẫn vận hành."],["05","Bảo trì","Theo dõi hiệu suất và hỗ trợ kỹ thuật trong vòng đời hệ thống."]].map(([n,t,d],i)=><ScrollAnimationWrapper key={n} animation="slide-in-right" delay={i*80}><div className="grid gap-4 bg-[var(--solar-primary-dark)] p-5 sm:grid-cols-[60px_160px_1fr] sm:items-center"><div className="text-xl font-black text-[var(--solar-primary)]">{n}</div><div className="font-black">{t}</div><div className="text-sm leading-6 text-emerald-50/65">{d}</div></div></ScrollAnimationWrapper>)}</div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-up"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Dự án tiêu biểu</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Hiệu quả được kể bằng con số</h2></div></ScrollAnimationWrapper>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{projects.map((p,index)=><ScrollAnimationWrapper key={p.title} animation={index%2===0?"fade-in-left":"fade-in-right"} delay={index*80}><article className="group overflow-hidden border border-emerald-950/10"><div className="relative aspect-[4/3] overflow-hidden"><Image src={p.image} alt={p.title} fill className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-6"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400"><span>{p.location}</span><span>{p.capacity}</span></div><h3 className="mt-3 text-2xl font-black">{p.title}</h3><div className="mt-4 border-t border-emerald-950/10 pt-4 text-sm text-slate-500">Tiết kiệm ước tính <strong className="text-[var(--solar-primary-dark)]">{p.saving}</strong></div></div></article></ScrollAnimationWrapper>)}</div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-down"><div className="text-center"><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Khách hàng nói gì</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Niềm tin sau khi hệ thống đi vào vận hành</h2></div></ScrollAnimationWrapper>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{[
            ["Anh Hoàng","Thủ Đức, TP.HCM","★★★★★","Sau 5 tháng, tiền điện giảm đúng gần mức tư vấn. App theo dõi dễ hiểu và đội kỹ thuật phản hồi nhanh."],
            ["Chị Thanh","Biên Hòa, Đồng Nai","★★★★★","Phần thi công gọn, dây đi đẹp. Mình thích nhất là báo giá rõ từng thiết bị chứ không gom chung khó kiểm tra."],
            ["Anh Phúc","Đức Hòa, Long An","★★★★★","Nhà xưởng chạy ban ngày nên hiệu quả khá rõ. Có báo cáo sản lượng để bên mình theo dõi hàng tháng."],
          ].map(([name,area,stars,quote],i)=><ScrollAnimationWrapper key={name} animation="fade-in-up" delay={i*100}><blockquote className="h-full border border-emerald-950/10 bg-white p-7"><div className="text-[var(--solar-accent)]">{stars}</div><p className="mt-5 leading-7 text-slate-600">“{quote}”</p><footer className="mt-7 border-t border-emerald-950/10 pt-4"><div className="font-black">{name}</div><div className="text-sm text-slate-400">{area}</div></footer></blockquote></ScrollAnimationWrapper>)}</div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-up"><div className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Thương hiệu thiết bị phân phối</div></ScrollAnimationWrapper>
          <div className="mt-8 grid grid-cols-2 gap-px bg-emerald-950/10 sm:grid-cols-3 lg:grid-cols-6">{["LONGi","JinkoSolar","Huawei","Sungrow","GoodWe","Pylontech"].map((brand,i)=><ScrollAnimationWrapper key={brand} animation="fade-in-up" delay={i*60}><div className="bg-[var(--solar-white)] px-4 py-7 text-center text-sm font-black tracking-wide text-slate-600">{brand}</div></ScrollAnimationWrapper>)}</div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <ScrollAnimationWrapper animation="slide-in-left"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">FAQ</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Những câu hỏi trước khi lắp solar</h2><p className="mt-5 leading-7 text-slate-600">Nếu cần con số sát công trình của bạn hơn, đội kỹ thuật có thể khảo sát và tư vấn cấu hình.</p></div></ScrollAnimationWrapper>
          <ScrollAnimationWrapper animation="slide-in-right"><div className="border-t border-emerald-950/10">{faqs.map(([q,a],i)=><div key={q} className="border-b border-emerald-950/10"><button type="button" className="flex w-full items-center justify-between gap-4 py-5 text-left font-black" onClick={()=>setOpenFaq(openFaq===i?-1:i)}><span>{q}</span><ChevronDownIcon className={`h-5 w-5 shrink-0 transition ${openFaq===i?"rotate-180":""}`} /></button>{openFaq===i&&<p className="pb-6 pr-8 leading-7 text-slate-600">{a}</p>}</div>)}</div></ScrollAnimationWrapper>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 bg-[var(--solar-primary)] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <ScrollAnimationWrapper animation="fade-in-left"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]/60">Nhận báo giá</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em] text-[var(--solar-primary-dark)] md:text-5xl">Gửi thông tin trong 1 phút</h2><p className="mt-5 max-w-xl text-lg leading-8 text-[var(--solar-primary-dark)]/75">Form demo chỉ xử lý trên trình duyệt, không gửi dữ liệu lên server.</p><div className="mt-8 flex items-center gap-3 font-black text-[var(--solar-primary-dark)]"><PhoneIcon className="h-5 w-5" /> Hotline {SITE_CONFIG.displayPhone}</div></div></ScrollAnimationWrapper>
          <ScrollAnimationWrapper animation="fade-in-right"><form onSubmit={submitLead} className="bg-white p-6 md:p-8">{sent ? <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><CheckCircleIcon className="h-14 w-14 text-[var(--solar-primary-dark)]" /><h3 className="mt-4 text-2xl font-black">Đã ghi nhận trên giao diện demo</h3><p className="mt-2 max-w-md text-slate-500">Không có dữ liệu nào được gửi hoặc lưu ở backend.</p><button type="button" onClick={()=>setSent(false)} className="mt-6 rounded-xl border border-emerald-950/15 px-5 py-3 font-bold">Nhập lại</button></div> : <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-600">Họ và tên<input required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[var(--solar-primary-dark)]" placeholder="Nguyễn Văn A" /></label><label className="text-sm font-bold text-slate-600">Số điện thoại<input required pattern="^(0|\\+84)[0-9]{9,10}$" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[var(--solar-primary-dark)]" placeholder="09xxxxxxxx" /></label><label className="text-sm font-bold text-slate-600">Tiền điện/tháng<input defaultValue={bill} type="number" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[var(--solar-primary-dark)]" /></label><label className="text-sm font-bold text-slate-600">Loại mái<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-[var(--solar-primary-dark)]"><option>Mái tôn</option><option>Mái bê tông</option><option>Mái ngói</option><option>Khác</option></select></label><label className="text-sm font-bold text-slate-600 sm:col-span-2">Ghi chú<textarea rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[var(--solar-primary-dark)]" placeholder="Nhu cầu hoặc thời gian muốn khảo sát..." /></label><button className="rounded-xl bg-[var(--solar-primary-dark)] px-6 py-4 font-black text-white sm:col-span-2">Nhận tư vấn cấu hình</button></div>}</form></ScrollAnimationWrapper>
        </div>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-2 rounded-2xl border border-emerald-950/10 bg-white/95 p-2 shadow-2xl backdrop-blur lg:hidden">
        <a href={`tel:${SITE_CONFIG.phone}`} className="rounded-xl bg-[var(--solar-primary-dark)] px-3 py-3 text-center text-xs font-black text-white">Gọi ngay</a>
        <a href={SITE_CONFIG.zalo} className="rounded-xl bg-[var(--solar-primary-light)] px-3 py-3 text-center text-xs font-black text-[var(--solar-primary-dark)]">Zalo</a>
        <a href={SITE_CONFIG.messenger} className="rounded-xl bg-[var(--solar-white)] px-3 py-3 text-center text-xs font-black text-slate-700">Messenger</a>
      </div>
    </main>
  );
}
