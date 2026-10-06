import Image from "next/image";
import Link from "next/link";
import { NAVIGATION_ITEMS, SITE_CONFIG, SOCIAL_LINKS } from "@/utils/constants";

export default function Footer() {
  return (
    <footer className="bg-[var(--solar-primary-dark)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          <div><div className="flex items-center gap-3"><Image src="/images/logo.png" alt={SITE_CONFIG.name} width={48} height={48} className="h-12 w-12 rounded-xl bg-white object-contain" /><div><div className="text-xl font-black">{SITE_CONFIG.name}</div><div className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">Năng lượng cho giá trị dài hạn</div></div></div><p className="mt-5 max-w-md leading-7 text-emerald-50/70">{SITE_CONFIG.description}</p><div className="mt-6 flex flex-wrap gap-2">{SOCIAL_LINKS.map((social)=><a key={social.name} href={social.url} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-emerald-50/80 transition hover:bg-white/10">{social.name}</a>)}</div></div>
          <div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--solar-primary)]">Điều hướng</h2><div className="mt-5 space-y-3">{NAVIGATION_ITEMS.slice(0,5).map((item)=><Link key={item.href} href={item.href} className="block text-sm text-emerald-50/70 hover:text-white">{item.name}</Link>)}</div></div>
          <div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--solar-primary)]">Giải pháp</h2><div className="mt-5 space-y-3 text-sm text-emerald-50/70"><p>Solar hộ gia đình</p><p>Solar nhà xưởng</p><p>Hệ hybrid lưu trữ</p><p>Bảo trì & nâng cấp</p></div></div>
          <div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--solar-primary)]">Liên hệ</h2><div className="mt-5 space-y-3 text-sm leading-6 text-emerald-50/75"><a href={`tel:${SITE_CONFIG.phone}`} className="block font-bold text-white">{SITE_CONFIG.displayPhone}</a><a href={`mailto:${SITE_CONFIG.email}`} className="block">{SITE_CONFIG.email}</a><p>{SITE_CONFIG.address}</p><p>{SITE_CONFIG.workingHours}</p></div></div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-emerald-50/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><p>© {new Date().getFullYear()} {SITE_CONFIG.name}. Tất cả quyền được bảo lưu.</p><p>Phân phối thiết bị • Tư vấn thiết kế • Thi công điện mặt trời</p></div></div>
    </footer>
  );
}
