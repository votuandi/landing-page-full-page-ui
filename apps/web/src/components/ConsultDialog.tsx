"use client";

import { useDialog, MessengerIcon, ZaloIcon } from "@solar/ui";

import { useRef, useState } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";

import { useLang } from "@/i18n/LangProvider";

import LeadForm from "@/components/LeadForm";

/** Nội dung popup tư vấn: nút "Nhận tư vấn ngay" (mở form ngắn) + Zalo/Messenger (chỉ hiện khi có link). */
export default function ConsultDialog({ startWithForm, onClose }: { startWithForm: boolean; onClose: () => void }) {
  const { tr } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [withForm, setWithForm] = useState(startWithForm);
  const { zalo, messenger } = SITE_CONFIG.contact;
  useDialog(ref, true, onClose);

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-scrim/45 p-3 backdrop-blur-sm sm:items-center" role="presentation">
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="consult-title" tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-bg-elevated shadow-2xl">
        <div aria-hidden className="relative h-24 overflow-hidden bg-primary"><span className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-accent" /></div>
        <button type="button" onClick={onClose} className="t15-icon-button absolute right-4 top-4" aria-label={tr("Đóng popup tư vấn", "Close")} data-autofocus><XMarkIcon className="h-5 w-5" /></button>
        <div className="-mt-8 px-6 pb-6 sm:px-7 sm:pb-7">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-lg ring-4 ring-bg-elevated"><ChatBubbleLeftRightIcon className="h-7 w-7" /></span>
          <h2 id="consult-title" className="mt-4 pr-10 text-2xl font-black tracking-[-.02em] text-fg">{tr("Tư vấn sản phẩm & lắp đặt", "Product & installation advice")}</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">{tr(`Cần chọn tấm pin, pin lưu trữ, đèn năng lượng mặt trời hay lắp trọn gói? Kỹ sư tư vấn miễn phí, gọi lại trong ${SITE_CONFIG.callbackHours} giờ.`, `Choosing panels, batteries, solar lights or a turnkey system? Free advice — we call back within ${SITE_CONFIG.callbackHours} hours.`)}</p>

          <div className="mt-5">
            {withForm ? (
              <LeadForm source="popup" columns={1} fields={{}} submitLabel={tr("Gọi lại cho tôi", "Call me back")} />
            ) : (
              <button type="button" onClick={() => setWithForm(true)} className="t15-button t15-button-accent min-h-12 w-full text-base">{tr("Nhận tư vấn ngay", "Get advice now")}</button>
            )}
          </div>

          {(zalo || messenger) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {zalo && <a href={zalo} target="_blank" rel="noopener noreferrer" className={`t15-button t15-button-primary ${messenger ? "" : "col-span-2"}`}><ZaloIcon className="h-5 w-5" />Zalo</a>}
              {messenger && <a href={messenger} target="_blank" rel="noopener noreferrer" className={`t15-button t15-button-secondary ${zalo ? "" : "col-span-2"}`}><MessengerIcon className="h-5 w-5" />Messenger</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
