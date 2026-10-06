"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { NAVIGATION_ITEMS, SITE_CONFIG } from "@/utils/constants";

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[var(--solar-white)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={SITE_CONFIG.name}>
          <Image src="/images/logo.png" alt={SITE_CONFIG.name} width={46} height={46} priority className="h-11 w-11 rounded-xl bg-white object-contain p-0.5" />
          <div className="min-w-0"><div className="truncate text-lg font-black tracking-tight text-[var(--solar-primary-dark)]">{SITE_CONFIG.name}</div><div className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">Solar engineering & distribution</div></div>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng chính">
          {NAVIGATION_ITEMS.map((item) => <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-700 transition hover:text-[var(--solar-primary-dark)]">{item.name}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={SITE_CONFIG.zalo} className="rounded-xl border border-emerald-900/15 bg-white px-4 py-2.5 text-sm font-bold text-[var(--solar-primary-dark)] transition hover:bg-emerald-50">Chat Zalo</a>
          <a href={`tel:${SITE_CONFIG.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-[var(--solar-primary-dark)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--solar-primary-dark)]"><PhoneIcon className="h-4 w-4" />{SITE_CONFIG.displayPhone}</a>
        </div>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-950/10 bg-white text-[var(--solar-primary-dark)] lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Đóng menu" : "Mở menu"}>{open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}</button>
      </div>
      {open && <div className="border-t border-emerald-950/10 bg-white px-4 py-4 lg:hidden"><nav className="mx-auto max-w-7xl space-y-1">{NAVIGATION_ITEMS.map((item)=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-emerald-50">{item.name}</Link>)}<div className="grid grid-cols-2 gap-2 pt-3"><a href={SITE_CONFIG.zalo} className="rounded-xl border border-emerald-900/15 px-4 py-3 text-center text-sm font-bold text-[var(--solar-primary-dark)]">Zalo</a><a href={`tel:${SITE_CONFIG.phone}`} className="rounded-xl bg-[var(--solar-primary-dark)] px-4 py-3 text-center text-sm font-bold text-white">Gọi ngay</a></div></nav></div>}
    </header>
  );
}
