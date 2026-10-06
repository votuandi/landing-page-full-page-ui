"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon, SpeakerXMarkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { STORY_TYPE_LABELS, type Story } from "@/data/stories";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import { TikTokIcon, YouTubeIcon } from "@/components/BrandIcons";

type Props = { stories: Story[]; startIndex: number; onClose: () => void };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Adapter theo provider: chỉ tạo khi modal mở, bị hủy (unmount) khi đổi video hoặc đóng ---------- */

type AdapterProps = { story: Story; muted: boolean; onProgress: (ratio: number) => void; onEnded: () => void };

/** "file" (mp4 trong /public) và "bunny" (mp4 trên CDN) dùng thẻ <video>. */
function VideoAdapter({ story, muted, onProgress, onEnded }: AdapterProps) {
  return (
    <video
      src={story.source.idOrSrc}
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
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(story.source.idOrSrc)}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&enablejsapi=1`;
  return <iframe ref={ref} src={src} title={story.shortTitle} allow="autoplay; encrypted-media; picture-in-picture" className="h-full w-full" onLoad={() => post({ event: "listening", id: story.id })} />;
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
  const src = `https://www.tiktok.com/player/v1/${encodeURIComponent(story.source.idOrSrc)}?autoplay=1&muted=1&loop=0&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`;
  return <iframe ref={ref} src={src} title={story.shortTitle} allow="autoplay; encrypted-media; fullscreen" className="h-full w-full" />;
}

const ADAPTERS = { file: VideoAdapter, bunny: VideoAdapter, youtube: YouTubeAdapter, tiktok: TikTokAdapter } as const;

/** Nền tảng của link gốc (để ghi "Xem trên TikTok/YouTube"); không nhận ra → không hiện nút phụ. */
function platformOf(url?: string) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("tiktok.com")) return { name: "TikTok", Icon: TikTokIcon };
    if (host.endsWith("youtube.com") || host === "youtu.be") return { name: "YouTube", Icon: YouTubeIcon };
  } catch {}
  return null;
}

/* ---------- Modal ---------- */

export default function StoryPlayer({ stories, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { focusSegment } = useSegment();
  const story = stories[index];

  const indexRef = useRef(index);
  indexRef.current = index;

  const go = useCallback((delta: number) => {
    const next = indexRef.current + delta;
    if (next < 0 || next >= stories.length) return;
    setProgress(0);
    setIndex(next);
  }, [stories.length]);

  // Tự chuyển video khi hết (tắt khi người dùng chọn giảm chuyển động)
  const onEnded = useCallback(() => { if (!reducedMotion()) go(1); }, [go]);

  // Chỉ preload poster của video kế tiếp
  useEffect(() => {
    const next = stories[index + 1];
    if (next) { const img = new window.Image(); img.src = next.poster; }
  }, [index, stories]);

  // Khóa cuộn trang, đưa focus vào modal, phím tắt và focus trap
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], iframe, video, [tabindex]:not([tabindex='-1'])"))
          .filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!dialogRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [go, onClose]);

  const onTouchStart = (e: TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90) onClose();
  };

  const requestQuote = () => {
    onClose();
    // đợi modal đóng (mở lại cuộn trang) rồi mới cuộn tới calculator với phân khúc điền sẵn
    setTimeout(() => focusSegment(story.segment, SECTION_IDS.calculator, "story-cta"), 30);
  };

  const Adapter = ADAPTERS[story.source.provider];
  const platform = platformOf(story.source.originalUrl);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Video: ${story.shortTitle}`}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/95 backdrop-blur-sm"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative h-full w-full overflow-hidden bg-scrim sm:h-[min(92vh,860px)] sm:w-auto sm:max-w-full sm:rounded-[28px] sm:border sm:border-on-media/15" style={{ aspectRatio: "9 / 16" }}>
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
          <span className="rounded-full bg-scrim/70 px-3 py-1 text-xs font-bold text-on-media backdrop-blur">{STORY_TYPE_LABELS[story.type]} · {index + 1}/{stories.length}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"} className="grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-media backdrop-blur">
              {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng video" className="grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-media backdrop-blur"><XMarkIcon className="h-6 w-6" /></button>
          </div>
        </div>

        {/* Vùng chạm trái/phải để chuyển video */}
        <button type="button" tabIndex={-1} onClick={() => go(-1)} aria-hidden disabled={index === 0} className="absolute bottom-44 left-0 top-20 z-10 w-1/3 disabled:cursor-default" />
        <button type="button" tabIndex={-1} onClick={() => go(1)} aria-hidden disabled={index === stories.length - 1} className="absolute bottom-44 right-0 top-20 z-10 w-1/3 disabled:cursor-default" />

        {/* Overlay đáy */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-scrim/95 via-scrim/80 to-transparent p-4 pt-16 text-on-media" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <div className="text-lg font-black leading-snug">{story.shortTitle}</div>
          <div className="mt-1 text-sm text-on-media/90">📍 {story.location} · {story.kwp} kWp</div>
          <button type="button" onClick={requestQuote} className="t5-button t5-button-primary mt-4 min-h-12 w-full text-base">Nhận báo giá công trình tương tự <ArrowRightIcon className="h-5 w-5" /></button>
          {platform && (
            <a href={story.source.originalUrl} target="_blank" rel="noopener noreferrer" className="mx-auto mt-2 flex min-h-11 w-fit items-center gap-1.5 px-3 text-xs font-bold text-on-media/90 underline-offset-4 hover:underline">
              <platform.Icon className="h-4 w-4" />Xem trên {platform.name}
            </a>
          )}
        </div>
      </div>

      {/* Mũi tên desktop */}
      <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Video trước" className="absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-on-media/20 bg-on-media/10 text-on-media backdrop-blur-xl disabled:opacity-30 lg:grid"><ChevronLeftIcon className="h-6 w-6" /></button>
      <button type="button" onClick={() => go(1)} disabled={index === stories.length - 1} aria-label="Video tiếp theo" className="absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-on-media/20 bg-on-media/10 text-on-media backdrop-blur-xl disabled:opacity-30 lg:grid"><ChevronRightIcon className="h-6 w-6" /></button>
    </div>
  );
}
