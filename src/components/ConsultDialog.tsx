"use client";

import { useRef, useState } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";
import { useDialog } from "@/lib/useDialog";
import { MessengerIcon, ZaloIcon } from "@/components/BrandIcons";
import LeadForm from "@/components/LeadForm";

/** Nội dung popup tư vấn: nút "Nhận tư vấn ngay" (mở form ngắn) + Zalo/Messenger (chỉ hiện khi có link). */
export default function ConsultDialog({ startWithForm, onClose }: { startWithForm: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [withForm, setWithForm] = useState(startWithForm);
  const { zalo, messenger } = SITE_CONFIG.contact;
  useDialog(ref, true, onClose);

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-scrim/40 p-3 backdrop-blur-sm sm:items-center" role="presentation">
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="consult-title" tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-on-media/70 bg-bg-elevated p-6 shadow-2xl sm:p-7">
        <button type="button" onClick={onClose} className="t5-icon-button absolute right-4 top-4" aria-label="Đóng popup tư vấn" data-autofocus><XMarkIcon className="h-5 w-5" /></button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent"><ChatBubbleLeftRightIcon className="h-6 w-6" /></span>
        <h2 id="consult-title" className="mt-4 pr-10 text-2xl font-black tracking-[-.02em] text-fg">Tư vấn sản phẩm</h2>
        <p className="mt-2 text-sm leading-6 text-fg-muted">Cần chọn tấm pin, đèn năng lượng mặt trời hay lắp trọn gói? Kỹ thuật viên tư vấn miễn phí, gọi lại trong {SITE_CONFIG.callbackHours} giờ.</p>

        <div className="mt-5">
          {withForm ? (
            <LeadForm source="popup" columns={1} fields={{}} submitLabel="Gọi lại cho tôi" />
          ) : (
            <button type="button" onClick={() => setWithForm(true)} className="t5-button t5-button-primary min-h-12 w-full text-base">Nhận tư vấn ngay</button>
          )}
        </div>

        {(zalo || messenger) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {zalo && <a href={zalo} target="_blank" rel="noopener noreferrer" className={`t5-button t5-button-accent ${messenger ? "" : "col-span-2"}`}><ZaloIcon className="h-5 w-5" />Zalo</a>}
            {messenger && <a href={messenger} target="_blank" rel="noopener noreferrer" className={`t5-button t5-button-secondary ${zalo ? "" : "col-span-2"}`}><MessengerIcon className="h-5 w-5" />Messenger</a>}
          </div>
        )}
      </div>
    </div>
  );
}
