"use client";
import { useEffect, useState } from "react";
import { MessengerIcon, ZaloIcon } from "@solar/ui";
import { ChatBubbleLeftRightIcon, DocumentTextIcon, PhoneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ClientLink } from "../../shared/links";
import { openConsult } from "../events";

const ICONS = { consult: DocumentTextIcon, call: PhoneIcon, zalo: ZaloIcon, messenger: MessengerIcon };
type Item = { kind: keyof typeof ICONS; label: string; link?: Omit<ClientLink, "label"> };
const ACTION = "flex min-h-12 items-center gap-2.5 rounded-full border px-[17px] py-3 text-body-sm font-black shadow-md transition hover:border-secondary hover:bg-bg-tint";
const TONES = ["border-line/15 bg-bg-elevated text-primary", "border-secondary/20 bg-accent-soft text-secondary-deep"];

export default function ContactDock({ items, mobileBar, ariaLabel, ui }: { items: Item[]; mobileBar: boolean; ariaLabel: string; ui: { open: string; close: string } }) {
  // null = chưa hydrate: CSS quyết định (mở trên desktop, thu gọn trên mobile) để không nhấp nháy.
  const [expanded, setExpanded] = useState<boolean | null>(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  const open = expanded ?? false;
  const render = (item: Item, i: number, className: string) => {
    const Icon = ICONS[item.kind];
    const content = <><Icon aria-hidden className="h-[22px] w-[22px] shrink-0" />{item.label}</>;
    return item.kind === "consult"
      ? <button key={i} type="button" onClick={openConsult} className={className}>{content}</button>
      : <a key={i} href={item.link?.href} className={className} target={item.link?.external ? "_blank" : undefined} rel={item.link?.external ? "noopener noreferrer" : undefined}>{content}</a>;
  };
  return <>
    <aside aria-label={ariaLabel} className={`fixed right-3 z-40 flex max-w-[calc(100vw-32px)] flex-col items-end gap-2.5 md:bottom-6 md:right-5 ${mobileBar ? "bottom-[calc(82px+env(safe-area-inset-bottom))]" : "bottom-6"}`}>
      <nav id="t10-contact-actions" aria-label={ariaLabel}
        className={`${expanded === null ? "hidden md:flex" : open ? "flex" : "hidden"} max-h-[calc(100svh-260px)] flex-col gap-2 overflow-auto p-[5px] md:max-h-[calc(100svh-210px)]`}>
        {items.map((item, i) => render(item, i, `${ACTION} ${TONES[i % 2]}`))}
      </nav>
      <button type="button" aria-controls="t10-contact-actions" aria-expanded={expanded ?? undefined}
        onClick={() => setExpanded(!(expanded ?? window.matchMedia("(min-width: 768px)").matches))}
        className="flex min-h-12 items-center gap-2.5 rounded-full border border-primary bg-primary px-3.5 py-2.5 text-xs font-black text-on-primary shadow-lg md:px-[17px] md:py-3 md:text-body-sm">
        {expanded === null
          ? <><span className="contents md:hidden"><ChatBubbleLeftRightIcon aria-hidden className="h-[22px] w-[22px]" />{ui.open}</span><span className="hidden md:contents"><XMarkIcon aria-hidden className="h-[22px] w-[22px]" />{ui.close}</span></>
          : <>{open ? <XMarkIcon aria-hidden className="h-[22px] w-[22px]" /> : <ChatBubbleLeftRightIcon aria-hidden className="h-[22px] w-[22px]" />}{open ? ui.close : ui.open}</>}
      </button>
    </aside>
    {mobileBar && (
      <nav aria-label={ariaLabel} className="fixed inset-x-0 bottom-0 z-40 grid gap-2 border-t border-bg-sky bg-bg-elevated/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
        style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))` }}>
        {items.slice(-3).map((item, i, list) => render(item, i, `flex min-h-11 items-center justify-center gap-1 rounded-full px-2 text-xs font-black ${i === list.length - 1 ? "bg-accent text-on-accent" : "bg-primary text-on-primary"} [&>svg]:hidden`))}
      </nav>
    )}
  </>;
}
