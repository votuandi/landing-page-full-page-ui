"use client";

import { TikTokIcon, YouTubeIcon, useDialog } from "@solar/ui";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon, SpeakerXMarkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { StoryView as Story } from "./storyView";
import { storyEmbed } from "./storyEmbed";
import { Anchor } from "./Anchor";
import { storyQuoteLink } from "./storyQuote";
import type { Locale } from "../site";


type Props = { stories: Story[]; startIndex: number; onClose: () => void; locale: Locale; ctaLabel?: string; quote?: boolean };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Adapter theo provider: chỉ tạo khi modal mở, bị hủy (unmount) khi đổi video hoặc đóng ---------- */

type AdapterProps = { story: Story; muted: boolean; onProgress: (ratio: number) => void; onEnded: () => void };

/** "file" (mp4 trong /public) và "bunny" (mp4 trên CDN) dùng thẻ <video>. */
function VideoAdapter({ story, muted, onProgress, onEnded }: AdapterProps) {
  return (
    <video
      src={storyEmbed(story.source).src}
      poster={story.poster}
      autoPlay
      muted={muted}
      playsInline
      preload="auto"
      className="h-full w-full object-cover"
      onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) onProgress(v.currentTime / v.duration); }}
      onEnded={onEnded}
    />
  );
}

/** YouTube qua youtube-nocookie.com, điều khiển bằng IFrame API (postMessage). */
function YouTubeAdapter({ story, muted, onProgress, onEnded }: AdapterProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const post = useCallback((msg: object) => ref.current?.contentWindow?.postMessage(JSON.stringify(msg), "https://www.youtube-nocookie.com"), []);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube-nocookie.com") return;
      try {
        const info = (typeof e.data === "string" ? JSON.parse(e.data) : e.data)?.info;
        if (info?.duration && typeof info.currentTime === "number") onProgress(info.currentTime / info.duration);
        if (info?.playerState === 0) onEnded();
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onProgress, onEnded]);
  useEffect(() => { post({ event: "command", func: muted ? "mute" : "unMute", args: [] }); }, [muted, post]);
  const src = `${storyEmbed(story.source).src}&enablejsapi=1`;
  return <iframe ref={ref} src={src} title={story.title} allow="autoplay; encrypted-media; picture-in-picture" className="h-full w-full" onLoad={() => post({ event: "listening", id: story.id })} />;
}

/** TikTok qua player chính thức tiktok.com/player/v1 (postMessage "x-tiktok-player"). */
function TikTokAdapter({ story, muted, onProgress, onEnded }: AdapterProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const post = useCallback((type: string) => ref.current?.contentWindow?.postMessage({ type, "x-tiktok-player": true }, "https://www.tiktok.com"), []);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.tiktok.com" || !e.data?.["x-tiktok-player"]) return;
      if (e.data.type === "onCurrentTime" && e.data.value?.duration) onProgress(e.data.value.currentTime / e.data.value.duration);
      if (e.data.type === "onStateChange" && e.data.value === 0) onEnded();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onProgress, onEnded]);
  useEffect(() => { post(muted ? "mute" : "unMute"); }, [muted, post]);
  const src = storyEmbed(story.source).src;
  return <iframe ref={ref} src={src} title={story.title} allow="autoplay; encrypted-media; fullscreen" className="h-full w-full" />;
}

const ADAPTERS = { file: VideoAdapter, bunny: VideoAdapter, youtube: YouTubeAdapter, tiktok: TikTokAdapter } as const;

/** Nền tảng của link gốc (để ghi "Xem trên TikTok/YouTube"); không nhận ra → không hiện nút phụ. */
function platformOf(url?: string) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if ((host === "tiktok.com" || host.endsWith(".tiktok.com"))) return { name: "TikTok", Icon: TikTokIcon };
    if ((host === "youtube.com" || host.endsWith(".youtube.com")) || host === "youtu.be") return { name: "YouTube", Icon: YouTubeIcon };
  } catch {}
  return null;
}

/* ---------- Modal ---------- */

export default function StoryPlayer({ stories, startIndex, onClose, locale, ctaLabel, quote = true }: Props) {
  const tr = (vi: string, en: string) => locale === "en" ? en : vi;
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const story = stories[index];

  const go = useCallback((delta: number) => {
    setProgress(0);
    setIndex((current) => Math.max(0, Math.min(stories.length - 1, current + delta)));
  }, [stories.length]);

  // Tự chuyển video khi hết (tắt khi người dùng chọn giảm chuyển động)
  const onEnded = useCallback(() => { if (!reducedMotion()) go(1); }, [go]);

  // Chỉ preload poster của video kế tiếp
  useEffect(() => {
    const next = stories[index + 1];
    if (next?.poster) { const img = new window.Image(); img.src = next.poster; }
  }, [index, stories]);

  useDialog(dialogRef, true, onClose);
  // Arrow keys switch stories; useDialog handles scroll, Escape, Tab and focus restoration.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

  const onTouchStart = (e: TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90) onClose();
  };



  const Adapter = ADAPTERS[story.source.provider];
  const platform = platformOf(story.source.originalUrl);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Video: ${story.title}`}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/95 backdrop-blur-sm"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative h-full w-full overflow-hidden bg-scrim sm:h-[min(92vh,860px)] sm:w-auto sm:max-w-full sm:rounded-card sm:border sm:border-on-media/15" style={{ aspectRatio: "9 / 16" }}>
        <Adapter key={story.id} story={story} muted={muted} onProgress={setProgress} onEnded={onEnded} />

        {/* Thanh tiến trình kiểu story */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1" aria-hidden>
          {stories.map((s, i) => (
            <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-on-media/30">
              <span className="block h-full rounded-full bg-on-media" style={{ width: `${i < index ? 100 : i === index ? Math.round(progress * 100) : 0}%` }} />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-3 top-6 z-20 flex items-center justify-between gap-2">
          <span className="rounded-full bg-scrim/70 px-3 py-1 text-xs font-bold text-on-media backdrop-blur">{story.kindLabel} · {index + 1}/{stories.length}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? tr("Bật tiếng", "Unmute") : tr("Tắt tiếng", "Mute")} className="grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-media backdrop-blur">
              {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
            </button>
            <button ref={closeRef} data-autofocus type="button" onClick={onClose} aria-label={tr("Đóng video", "Close video")} className="grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-media backdrop-blur"><XMarkIcon className="h-6 w-6" /></button>
          </div>
        </div>

        {/* Vùng chạm trái/phải để chuyển video */}
        <button type="button" tabIndex={-1} onClick={() => go(-1)} aria-hidden disabled={index === 0} className="absolute bottom-44 left-0 top-20 z-10 w-1/3 disabled:cursor-default" />
        <button type="button" tabIndex={-1} onClick={() => go(1)} aria-hidden disabled={index === stories.length - 1} className="absolute bottom-44 right-0 top-20 z-10 w-1/3 disabled:cursor-default" />

        {/* Overlay đáy */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-scrim/95 via-scrim/80 to-transparent p-4 pt-16 text-on-media" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <div className="text-lg font-black leading-snug">{story.title}</div>
          <div className="mt-1 text-sm text-on-media/90">📍 {story.location}{story.kwp > 0 ? ` · ${story.kwp} kWp` : ""}</div>
          {quote && <Anchor link={storyQuoteLink(story, locale, ctaLabel)} onNavigate={onClose} className="t15-button t15-button-accent mt-4 min-h-12 w-full text-base">{ctaLabel ?? tr("Nhận báo giá công trình tương tự", "Get a quote for a similar project")} <ArrowRightIcon aria-hidden className="h-5 w-5" /></Anchor>}
          {platform && (
            <a href={story.source.originalUrl} target="_blank" rel="noopener noreferrer" className="mx-auto mt-2 flex min-h-11 w-fit items-center gap-1.5 px-3 text-xs font-bold text-on-media/90 underline-offset-4 hover:underline">
              <platform.Icon className="h-4 w-4" />{tr("Xem trên", "Watch on")} {platform.name}
            </a>
          )}
        </div>
      </div>

      {/* Mũi tên desktop */}
      <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={tr("Video trước", "Previous video")} className="absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-on-media/20 bg-on-media/10 text-on-media backdrop-blur-xl disabled:opacity-30 lg:grid"><ChevronLeftIcon className="h-6 w-6" /></button>
      <button type="button" onClick={() => go(1)} disabled={index === stories.length - 1} aria-label={tr("Video tiếp theo", "Next video")} className="absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-on-media/20 bg-on-media/10 text-on-media backdrop-blur-xl disabled:opacity-30 lg:grid"><ChevronRightIcon className="h-6 w-6" /></button>
    </div>
  );
}
