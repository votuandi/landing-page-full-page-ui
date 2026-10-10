"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onOpenConsult } from "../events";
import { createConsultSession } from "./session";
import type { ConsultDialogProps } from "./dialog";

const ConsultDialog = dynamic(() => import("./dialog"), { ssr: false });
const session = createConsultSession();
// Access storage inside the session helper's try/catch (the getter itself can throw).
const storage = { getItem: (key: string) => window.sessionStorage.getItem(key), setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value) };

export default function ConsultPopup({ autoOpen, delayMs, scrollRatio, ...props }: Omit<ConsultDialogProps, "startWithForm" | "onClose"> & {
  autoOpen: boolean; delayMs: number; scrollRatio: number;
}) {
  const [state, setState] = useState({ open: false, withForm: false });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
    const show = () => {
      if (!session.shouldAutoOpen(storage, false)) { cleanup(); return; }
      if (document.querySelector('[aria-modal="true"]')) {
        cleanup(); timer = setTimeout(show, 5000); return;
      }
      session.markShown(storage); cleanup(); setState({ open: true, withForm: false });
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= scrollRatio) show();
    };
    const stopManual = onOpenConsult(() => {
      session.markShown(storage); cleanup(); setState({ open: true, withForm: true });
    });
    if (autoOpen && session.shouldAutoOpen(storage, false)) {
      timer = setTimeout(show, delayMs); window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => { cleanup(); stopManual(); };
  }, [autoOpen, delayMs, scrollRatio]);
  return state.open ? <ConsultDialog {...props} startWithForm={state.withForm} onClose={() => setState({ open: false, withForm: false })} /> : null;
}
