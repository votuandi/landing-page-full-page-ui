"use client";
import { useEffect, useRef, useId } from "react";
import { COPY } from "@/content/site";
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-lg rounded-[28px] border-0 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
      aria-labelledby={titleId}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-2xl font-black">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="t5-icon-button shrink-0"
          aria-label={COPY.shell.close}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
