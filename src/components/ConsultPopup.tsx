"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site.config";

const ConsultDialog = dynamic(() => import("@/components/ConsultDialog"), { ssr: false });

export const OPEN_CONSULT_EVENT = "t15:open-consult";
/** Mở popup tư vấn ngay (vd. nút "Nhận tư vấn" trên header), hiện sẵn form ngắn. */
export const openConsult = () => window.dispatchEvent(new Event(OPEN_CONSULT_EVENT));

const SESSION_KEY = "t15-consult-shown";
let shownInMemory = false; // fallback khi sessionStorage bị chặn

const alreadyShown = () => {
  try { return shownInMemory || window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return shownInMemory; }
};
const markShown = () => {
  shownInMemory = true;
  try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
};
/** Có hộp thoại khác đang mở (giỏ, video, xem nhanh) → hoãn popup. */
const otherDialogOpen = () => Boolean(document.querySelector('[aria-modal="true"]'));

/**
 * Popup "Tư vấn sản phẩm": tự hiện sau `popup.delayMs` HOẶC khi đã cuộn `popup.scrollRatio` trang,
 * tối đa 1 lần mỗi phiên. Chỉ tải phần giao diện khi thật sự hiện.
 */
export default function ConsultPopup() {
  const [state, setState] = useState<{ open: boolean; withForm: boolean }>({ open: false, withForm: false });
  const { enabled, delayMs, scrollRatio } = siteConfig.popup;

  useEffect(() => {
    const onManual = () => { markShown(); setState({ open: true, withForm: true }); };
    window.addEventListener(OPEN_CONSULT_EVENT, onManual);
    if (!enabled || alreadyShown()) return () => window.removeEventListener(OPEN_CONSULT_EVENT, onManual);

    let retry: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      if (alreadyShown()) return cleanup();
      if (otherDialogOpen()) { retry = setTimeout(show, 5000); return; }
      markShown();
      setState({ open: true, withForm: false });
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= scrollRatio) show();
    };
    const timer = setTimeout(show, delayMs);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return () => { cleanup(); clearTimeout(retry); window.removeEventListener(OPEN_CONSULT_EVENT, onManual); };
  }, [enabled, delayMs, scrollRatio]);

  if (!state.open) return null;
  return <ConsultDialog startWithForm={state.withForm} onClose={() => setState({ open: false, withForm: false })} />;
}
