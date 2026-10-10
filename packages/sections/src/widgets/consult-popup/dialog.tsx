"use client";
import { useRef, useState } from "react";
import { useDialog, MessengerIcon, ZaloIcon } from "@solar/ui";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LeadForm, type LeadFormText } from "../../shared/LeadForm";
import type { Locale } from "../../site";
import type { ClientLink } from "../../shared/links";

export type ConsultDialogProps = {
  sectionId: string; locale: Locale; title: string; description: string; openFormLabel: string;
  text: LeadFormText; channels: (ClientLink & { kind: "zalo" | "messenger" })[];
  startWithForm: boolean; onClose: () => void;
};
export default function ConsultDialog({ sectionId, locale, title, description, openFormLabel, text, channels, startWithForm, onClose }: ConsultDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [withForm, setWithForm] = useState(startWithForm);
  useDialog(ref, true, onClose);
  return <div className="fixed inset-0 z-[85] flex items-end justify-center bg-scrim/45 p-3 backdrop-blur-sm sm:items-center" role="presentation">
    <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={sectionId + "-title"} tabIndex={-1}
      className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-card bg-bg-elevated shadow-2xl">
      <div aria-hidden className="relative h-24 overflow-hidden bg-primary"><span className="absolute -right-6 -top-8 h-28 w-28 rounded-pill bg-accent" /></div>
      <button type="button" onClick={onClose} className="t15-icon-button absolute right-4 top-4" aria-label={locale === "vi" ? "Đóng popup tư vấn" : "Close advice dialog"} data-autofocus><XMarkIcon aria-hidden className="h-5 w-5" /></button>
      <div className="-mt-8 px-6 pb-6 sm:px-7 sm:pb-7">
        <span className="relative grid h-14 w-14 place-items-center rounded-card bg-accent text-on-accent shadow-lg ring-4 ring-bg-elevated"><ChatBubbleLeftRightIcon aria-hidden className="h-7 w-7" /></span>
        <h2 id={sectionId + "-title"} className="mt-4 pr-10 text-2xl font-black text-fg">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{description}</p>
        <div className="mt-5">{withForm || startWithForm ? <LeadForm locale={locale} source="popup" columns={1} fields={{ zalo: false, address: false, message: false }} text={text} />
          : <button type="button" onClick={() => setWithForm(true)} className="t15-button t15-button-accent min-h-12 w-full text-base">{openFormLabel}</button>}</div>
        {channels.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{channels.map(({ kind, label, href, external }, i) => {
          const Icon = kind === "zalo" ? ZaloIcon : MessengerIcon;
          return <a key={i} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
            className={`t15-button ${kind === "zalo" ? "t15-button-primary" : "t15-button-secondary"} ${channels.length === 1 ? "col-span-2" : ""}`}><Icon aria-hidden className="h-5 w-5" />{label}</a>;
        })}</div>}
      </div>
    </div>
  </div>;
}
