"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/utils/constants";

interface ProductData {
  id:number; name:string; price:string; originalPrice?:string; image:string; specs:string[];
  discount?:number; category:string; priceNumber:number; description?:string; features?:string[];
  warranty?:string; technicalSpecs?:Record<string,string>;
}
interface ProductDetailContentProps { product: ProductData; }

export default function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [activeImage,setActiveImage] = useState(0);
  const [quoteOpen,setQuoteOpen] = useState(false);
  const gallery = useMemo(() => {
    const fallback = product.category.includes("Pin") ? ["/images/product-2.jpg","/images/solar-battery-hero.jpg","/images/solar-installation-hero.jpg"] :
      product.category.includes("Tấm") ? ["/images/product-3.jpg","/images/solar-panels-hero.jpg","/images/solar-installation-hero.jpg"] :
      [product.image,"/images/solar-inverter-hero.jpg","/images/solar-installation-hero.jpg"];
    return Array.from(new Set([product.image,...fallback]));
  },[product]);

  return (
    <main className="bg-[var(--solar-white)]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[var(--solar-primary-dark)]">Trang chủ</Link><ChevronRightIcon className="h-4 w-4" />
          <Link href="/product" className="hover:text-[var(--solar-primary-dark)]">Sản phẩm</Link><ChevronRightIcon className="h-4 w-4" />
          <span className="truncate text-slate-700">{product.name}</span>
        </nav>
      </div>

      <section className="border-y border-emerald-950/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-14">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden border border-emerald-950/10 bg-[var(--solar-surface)]">
              <Image src={gallery[activeImage]} alt={product.name} fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 55vw" />
              {product.discount && <span className="absolute left-4 top-4 rounded-md bg-[var(--solar-primary)] px-3 py-1.5 text-xs font-black text-[var(--solar-primary-dark)]">Tiết kiệm {product.discount}%</span>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {gallery.map((src,index)=><button type="button" key={src} onClick={()=>setActiveImage(index)} className={`relative aspect-[4/3] overflow-hidden border ${activeImage===index?"border-[var(--solar-primary-dark)]":"border-emerald-950/10"}`}><Image src={src} alt={`${product.name} - góc nhìn ${index+1}`} fill className="object-cover" /></button>)}
            </div>
          </div>

          <div className="lg:pl-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--solar-primary-dark)]">{product.category}</div>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.035em] text-[var(--solar-primary-dark)] md:text-5xl">{product.name}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{product.description || "Thiết bị được chọn theo tiêu chí hiệu suất, độ ổn định và khả năng tích hợp trong hệ thống điện mặt trời dân dụng hoặc thương mại."}</p>

            <div className="mt-7 border-y border-emerald-950/10 py-5">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Giá thiết bị tham khảo</div>
              <div className="mt-1 flex items-end gap-3"><div className="text-3xl font-black text-[var(--solar-primary-dark)]">{product.price}</div>{product.originalPrice&&<div className="pb-1 text-sm text-slate-400 line-through">{product.originalPrice}</div>}</div>
              <p className="mt-2 text-xs text-slate-500">Giá lắp đặt trọn gói phụ thuộc công suất, mái và cấu hình hệ thống.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {product.specs.slice(0,4).map((spec)=><div key={spec} className="border border-emerald-950/10 bg-[var(--solar-white)] p-4 text-sm font-bold text-slate-700"><CheckCircleIcon className="mb-2 h-5 w-5 text-[var(--solar-primary-dark)]" />{spec}</div>)}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={()=>setQuoteOpen(true)} className="rounded-xl bg-[var(--solar-primary-dark)] px-5 py-4 font-black text-white">Hỏi giá lắp đặt trọn gói</button>
              <a href={SITE_CONFIG.zalo} className="rounded-xl border border-emerald-950/15 bg-white px-5 py-4 text-center font-black text-[var(--solar-primary-dark)]">Chat Zalo</a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 border border-emerald-950/10 p-4"><ShieldCheckIcon className="h-6 w-6 shrink-0 text-[var(--solar-primary-dark)]" /><div><div className="font-black text-[var(--solar-primary-dark)]">Bảo hành rõ ràng</div><div className="mt-1 text-sm text-slate-500">{product.warranty || "Theo chính sách chính hãng"}</div></div></div>
              <a href="#thong-so" className="flex gap-3 border border-emerald-950/10 p-4"><ArrowDownTrayIcon className="h-6 w-6 shrink-0 text-[var(--solar-primary-dark)]" /><div><div className="font-black text-[var(--solar-primary-dark)]">Datasheet kỹ thuật</div><div className="mt-1 text-sm text-slate-500">Xem thông số bên dưới</div></div></a>
            </div>
          </div>
        </div>
      </section>

      <section id="thong-so" className="scroll-mt-24 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--solar-primary-dark)]">Thông tin sản phẩm</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">Điểm nổi bật & bảo hành</h2>
            <ul className="mt-7 space-y-3">{(product.features || product.specs).map((feature)=><li key={feature} className="flex gap-3 text-slate-600"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--solar-primary-dark)]" />{feature}</li>)}</ul>
            <div className="mt-8 bg-[var(--solar-primary-dark)] p-6 text-white"><div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--solar-primary)]">Hỗ trợ kỹ thuật</div><div className="mt-2 text-xl font-black">{SITE_CONFIG.displayPhone}</div><p className="mt-2 text-sm leading-6 text-emerald-50/70">Tư vấn tương thích inverter, pin lưu trữ, tủ điện và cấu hình lắp đặt.</p></div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-[-0.03em]">Thông số kỹ thuật</h2>
            <div className="mt-6 overflow-hidden border border-emerald-950/10 bg-white">
              {(product.technicalSpecs ? Object.entries(product.technicalSpecs) : product.specs.map((value,index)=>[`Thông số ${index+1}`,value])).map(([key,value],index)=><div key={key} className={`grid grid-cols-[.9fr_1.1fr] gap-4 px-5 py-4 text-sm ${index%2===0?"bg-[var(--solar-white)]":"bg-white"}`}><div className="font-bold text-slate-500">{key}</div><div className="font-semibold text-[var(--solar-primary-dark)]">{value}</div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--solar-primary-dark)] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><div className="text-xs font-black uppercase tracking-[0.15em] text-[var(--solar-primary)]">Cần cấu hình hoàn chỉnh?</div><h2 className="mt-2 text-3xl font-black">Đừng chỉ hỏi giá thiết bị — hãy hỏi chi phí hệ thống phù hợp.</h2></div>
          <button onClick={()=>setQuoteOpen(true)} className="rounded-xl bg-[var(--solar-primary)] px-6 py-4 font-black text-[var(--solar-primary-dark)]">Nhận cấu hình & báo giá</button>
        </div>
      </section>

      {quoteOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"><button className="absolute inset-0" aria-label="Đóng" onClick={()=>setQuoteOpen(false)} /><div className="relative w-full max-w-xl rounded-t-3xl bg-white p-6 sm:rounded-2xl sm:p-8"><div className="text-xs font-black uppercase tracking-[0.15em] text-[var(--solar-primary-dark)]">Báo giá trọn gói</div><h2 className="mt-2 text-2xl font-black">{product.name}</h2><p className="mt-2 text-sm text-slate-500">Demo frontend: thông tin không được gửi lên server.</p><div className="mt-6 grid gap-4"><input defaultValue={product.name} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" /><input placeholder="Họ và tên" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--solar-primary-dark)]" /><input placeholder="Số điện thoại" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--solar-primary-dark)]" /><textarea rows={3} placeholder="Diện tích mái / tiền điện / nhu cầu lưu trữ..." className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--solar-primary-dark)]" /><div className="grid grid-cols-2 gap-3"><button type="button" onClick={()=>setQuoteOpen(false)} className="rounded-xl border border-emerald-950/15 px-4 py-3 font-bold">Đóng</button><a href={`tel:${SITE_CONFIG.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--solar-primary-dark)] px-4 py-3 font-black text-white"><PhoneIcon className="h-5 w-5" /> Gọi tư vấn</a></div></div></div></div>}
    </main>
  );
}
