"use client";

import { ZaloIcon } from "@solar/ui";

import Link from "next/link";
import { HomeIcon, PhoneIcon, Squares2X2Icon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { primaryBranch, telHref, zaloHref } from "@/config/site";
import { useLang } from "@/i18n/LangProvider";

/** Thanh điều hướng cố định đáy màn hình (mobile/tablet): Trang chủ · Danh mục · Gọi · Zalo Gia đình · Zalo Nhà xưởng. */
export default function MobileBottomNav({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const { tr } = useLang();
  if (!siteConfig.mobileBottomNav.enabled) return null;
  const { household, factory } = siteConfig.zalo;
  const item = "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10.5px] font-bold leading-tight text-fg-muted transition active:scale-95";

  return (
    <nav aria-label={tr("Điều hướng nhanh", "Quick navigation")}
      className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-5 gap-1 border-t border-glass-border bg-bg-elevated/85 px-2 pt-1.5 shadow-[0_-20px_40px_-24px_rgb(var(--c-shadow)/.6)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}>
      <Link href="/" className={item}><HomeIcon className="h-5 w-5" />{tr("Trang chủ", "Home")}</Link>
      <button type="button" onClick={onMenu} aria-expanded={menuOpen} aria-controls="mobile-drawer" className={`${item} ${menuOpen ? "text-primary" : ""}`}><Squares2X2Icon className="h-5 w-5" />{tr("Danh mục", "Menu")}</button>
      <a href={telHref(primaryBranch.hotline.main)} className="flex flex-col items-center justify-center" aria-label={`${tr("Gọi", "Call")} ${primaryBranch.hotline.main}`}>
        <span className="-mt-5 grid h-14 w-14 place-items-center rounded-full border-4 border-bg-elevated bg-accent text-on-accent shadow-xl"><PhoneIcon className="h-6 w-6" /></span>
        <span className="mt-0.5 text-[10.5px] font-black text-fg">{tr("Gọi", "Call")}</span>
      </a>
      <a href={zaloHref(household.phone)} target="_blank" rel="noopener noreferrer" className={item}><ZaloIcon className="h-5 w-5 text-primary" />{tr(household.label)}</a>
      <a href={zaloHref(factory.phone)} target="_blank" rel="noopener noreferrer" className={item}><ZaloIcon className="h-5 w-5 text-accent-ink" />{tr(factory.label)}</a>
    </nav>
  );
}
