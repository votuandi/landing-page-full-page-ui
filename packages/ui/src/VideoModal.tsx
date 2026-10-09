"use client";

import { useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useModal } from "./useModal";

export type VideoSource = { provider: "youtube"; id: string } | { provider: "file"; src: string };

/**
 * Modal phát video. Iframe YouTube (youtube-nocookie) / thẻ <video> CHỈ được tạo khi modal mở,
 * nên trang không tải gì từ YouTube cho tới khi người dùng bấm xem.
 */
export function VideoModal({ video, title, onClose, vertical = false, closeLabel = "Đóng video" }: {
  video: VideoSource; title: string; onClose: () => void; vertical?: boolean; closeLabel?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModal(dialogRef, onClose, closeRef);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/90 p-3 backdrop-blur-sm sm:p-8">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label={closeLabel} tabIndex={-1} />
      <div className={`relative w-full overflow-hidden rounded-card border border-glass-border bg-scrim shadow-2xl ${vertical ? "max-w-[min(420px,calc((100svh-6rem)*9/16))] aspect-[9/16]" : "max-w-5xl aspect-video"}`}>
        {video.provider === "youtube" ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video src={video.src} title={title} controls autoPlay playsInline preload="metadata" className="h-full w-full bg-scrim object-contain" />
        )}
      </div>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel}
        className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full border border-glass-border bg-scrim/70 text-on-media backdrop-blur sm:right-6 sm:top-6">
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
