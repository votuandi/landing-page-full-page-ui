"use client";
import { ZaloIcon } from "@solar/ui";
import { HomeIcon, PhoneIcon, Squares2X2Icon, CalculatorIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";
import { openCalculator, openQuoteCart } from "@solar/core";
import type { ClientLink } from "../../shared/links";
import { toggleSiteMenu } from "../events";

const ICONS = { home: HomeIcon, menu: Squares2X2Icon, call: PhoneIcon, zalo: ZaloIcon, calculator: CalculatorIcon, cart: ShoppingBagIcon };
type Item = { icon: keyof typeof ICONS; label: string; emphasis?: boolean; link?: Omit<ClientLink, "label"> };
export default function MobileBottomNav({ items, ariaLabel }: { items: Item[]; ariaLabel: string }) {
  return <nav aria-label={ariaLabel} className="fixed inset-x-0 bottom-0 z-[80] grid gap-1 border-t border-glass-border bg-bg-elevated/85 px-2 pt-1.5 shadow-bottom-nav backdrop-blur-xl lg:hidden"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}>
    {items.map(({ icon, label, emphasis, link }, i) => {
      const Icon = ICONS[icon];
      const className = emphasis ? "flex min-h-14 flex-col items-center justify-center text-fg" : "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-card px-1 text-3xs font-bold leading-tight text-fg-muted transition motion-safe:active:scale-95";
      const content = emphasis ? <><span className="-mt-5 grid h-14 w-14 place-items-center rounded-pill border-4 border-bg-elevated bg-accent text-on-accent shadow-xl"><Icon aria-hidden className="h-6 w-6" /></span><span className="mt-0.5 text-3xs font-black">{label}</span></> : <><Icon aria-hidden className="h-5 w-5" />{label}</>;
      if (icon === "menu" || icon === "cart") return <button key={i} type="button" className={className} onClick={icon === "menu" ? toggleSiteMenu : openQuoteCart}>{content}</button>;
      return <a key={i} href={link?.href} className={className} target={link?.external ? "_blank" : undefined} rel={link?.external ? "noopener noreferrer" : undefined}
        onClick={link?.calculator ? (event) => { event.preventDefault(); openCalculator(link.calculator); } : undefined}>{content}</a>;
    })}
  </nav>;
}
