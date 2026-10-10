"use client";
import { MessengerIcon, ZaloIcon } from "@solar/ui";
import { ChatBubbleLeftRightIcon, PhoneIcon } from "@heroicons/react/24/solid";
import type { ClientLink } from "../../shared/links";
import { openConsult } from "../events";

const ICONS = { consult: ChatBubbleLeftRightIcon, call: PhoneIcon, zalo: ZaloIcon, messenger: MessengerIcon };
const TONES = { consult: "bg-bg-elevated text-primary border border-primary/20", call: "bg-primary text-on-primary", zalo: "bg-secondary text-on-secondary", messenger: "bg-bg-elevated text-fg border border-line/15" };
type Item = { kind: keyof typeof ICONS; label: string; link?: Omit<ClientLink, "label"> };
export default function ContactDock({ items, mobileBar, ariaLabel }: { items: Item[]; mobileBar: boolean; ariaLabel: string }) {
  const render = (mobile: boolean) => items.map(({ kind, label, link }, i) => {
    const Icon = ICONS[kind];
    const className = mobile
      ? `flex min-h-11 items-center justify-center gap-1.5 rounded-pill px-2 text-xs font-black ${TONES[kind]}`
      : `group flex h-14 items-center gap-2 overflow-hidden rounded-pill px-4 shadow-float transition motion-safe:hover:-translate-y-0.5 ${TONES[kind]}`;
    const content = <><Icon aria-hidden className={mobile ? "h-4 w-4 shrink-0" : "h-6 w-6 shrink-0"} />
      <span className={mobile ? "truncate" : "max-w-0 whitespace-nowrap text-sm font-black opacity-0 transition-all duration-motion-base group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:max-w-48 group-focus-visible:opacity-100"}>{label}</span></>;
    return kind === "consult" ? <button key={i} type="button" aria-label={label} onClick={openConsult} className={className}>{content}</button>
      : <a key={i} href={link?.href} aria-label={label} target={link?.external ? "_blank" : undefined} rel={link?.external ? "noopener noreferrer" : undefined} className={className}>{content}</a>;
  });
  return <>
    {mobileBar && <nav aria-label={ariaLabel} className="fixed inset-x-3 bottom-3 z-40 grid gap-2 rounded-pill border border-line/10 bg-bg-elevated/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, marginBottom: "env(safe-area-inset-bottom)" }}>{render(true)}</nav>}
    <nav aria-label={ariaLabel} className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 lg:flex">{render(false)}</nav>
  </>;
}
