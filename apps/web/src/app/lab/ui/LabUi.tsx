"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  SectionHead, CarouselNav, CountUp, useCountUp, useInViewOnce, useModal, useDialog,
  useSnapCarousel, pad2, MediaImage, Wordmark, VideoModal, PriceTag, delay,
  SectionReveal, TikTokIcon, YouTubeIcon, FacebookIcon, MessengerIcon, ZaloIcon,
} from "@solar/ui";

function Example({ name, children }: { name: string; children: ReactNode }) {
  return <section id={name} aria-labelledby={`${name}-title`} className="t15-card space-y-5 p-5 sm:p-8">
    <h2 id={`${name}-title`} className="text-xl font-black text-fg">{name}</h2>
    {children}
  </section>;
}

function ModalExample({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal(ref, onClose, closeRef);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label="Ví dụ useModal" className="fixed inset-0 z-[90] grid place-items-center bg-scrim/90 p-4">
    <div className="t15-card space-y-4 p-8">
      <p>[DỮ LIỆU MẪU] Tab ở trong hộp thoại; Esc đóng và trả focus.</p>
      <button ref={closeRef} type="button" className="t15-button t15-button-primary" onClick={onClose}>Đóng useModal</button>
      <a href="#useModal" className="t15-button t15-button-secondary">Liên kết trong hộp thoại</a>
    </div>
  </div>;
}

function DialogExample() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, open, () => setOpen(false));
  return <>
    <button type="button" className="t15-button t15-button-primary" onClick={() => setOpen(true)}>Mở useDialog</button>
    {open && <div ref={ref} role="dialog" aria-modal="true" aria-label="Ví dụ useDialog" tabIndex={-1} className="fixed inset-0 z-[90] grid place-items-center bg-scrim/90 p-4">
      <div className="t15-card space-y-4 p-8">
        <p>[DỮ LIỆU MẪU] Hook nhận trạng thái open từ bên gọi.</p>
        <button data-autofocus type="button" className="t15-button t15-button-primary" onClick={() => setOpen(false)}>Đóng useDialog</button>
        <a href="#useDialog" className="t15-button t15-button-secondary">Liên kết trong hộp thoại</a>
      </div>
    </div>}
  </>;
}

function CounterExample() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>();
  const value = useCountUp(1250, { start: seen });
  return <Example name="useInViewOnce">
    <div ref={ref}>Cuộn đến đây để bắt đầu: <span className="font-bold text-primary">{seen ? "Đã vào viewport" : "Đang chờ"}</span></div>
    <Example name="useCountUp"><output className="text-3xl font-black text-primary">{Math.round(value)}</output></Example>
  </Example>;
}

function CarouselExample() {
  const carousel = useSnapCarousel();
  return <Example name="useSnapCarousel">
    <div ref={carousel.ref} className="t15-no-scrollbar relative flex snap-x snap-mandatory gap-4 overflow-x-auto">
      {[1, 2, 3, 4, 5].map((item) => <div key={item} className="grid h-36 w-64 shrink-0 snap-start place-items-center rounded-card bg-bg-tint font-bold text-fg">[DỮ LIỆU MẪU] Thẻ {item}</div>)}
    </div>
    <Example name="CarouselNav"><CarouselNav prev={carousel.prev} next={carousel.next} atStart={carousel.atStart} atEnd={carousel.atEnd} /></Example>
    <Example name="pad2"><output>{pad2(carousel.index + 1)} / {pad2(carousel.count)}</output></Example>
    <Example name="DragScroll"><p>Kéo dải thẻ bằng chuột hoặc vuốt trên màn hình cảm ứng. DragScroll được gắn bởi SiteShell.</p></Example>
  </Example>;
}

export default function LabUi() {
  const [modalOpen, setModalOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  return <main className="t15-container space-y-8 py-12 text-fg">
    <SectionReveal />
    <header className="space-y-3">
      <h1 className="text-3xl font-black">Lab UI — Primitive</h1>
      <p className="text-fg-muted">[DỮ LIỆU MẪU] Ví dụ primitive dùng chung của @solar/ui.</p>
    </header>
    <Example name="SectionHead"><SectionHead eyebrow="[DỮ LIỆU MẪU]" title="Năng lượng cho mọi công trình" desc="Tiêu đề section theo theme hiện tại." /></Example>
    <CarouselExample />
    <Example name="CountUp"><span className="text-3xl font-black text-primary"><CountUp value={1250} /></span></Example>
    <CounterExample />
    <Example name="useModal"><button type="button" className="t15-button t15-button-primary" onClick={() => setModalOpen(true)}>Mở useModal</button>{modalOpen && <ModalExample onClose={() => setModalOpen(false)} />}</Example>
    <Example name="useDialog"><DialogExample /></Example>
    <Example name="MediaImage">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-card"><MediaImage src="/images/illustrations/home-solar.webp" alt="[DỮ LIỆU MẪU] Điện mặt trời nhà ở" sizes="(max-width: 640px) 100vw, 50vw" /></div>
        <div className="relative aspect-video overflow-hidden rounded-card"><MediaImage alt="[DỮ LIỆU MẪU] Ảnh chưa có" label="[DỮ LIỆU MẪU] Placeholder" sizes="(max-width: 640px) 100vw, 50vw" /></div>
      </div>
    </Example>
    <Example name="Wordmark"><div className="flex flex-wrap items-center gap-6">{(["sm", "md", "lg"] as const).map((size) => <Wordmark key={size} name="Solar Mẫu" short="SM" size={size} />)}</div></Example>
    <Example name="VideoModal"><button type="button" className="t15-button t15-button-primary" onClick={() => setVideoOpen(true)}>Mở VideoModal</button>{videoOpen && <VideoModal video={{ provider: "file", src: "/videos/hero_video.mp4" }} title="[DỮ LIỆU MẪU] Video điện mặt trời" onClose={() => setVideoOpen(false)} />}</Example>
    <Example name="PriceTag"><div className="flex flex-wrap gap-6"><PriceTag price={12000000} /><PriceTag price={12000000} salePrice={10000000} /><PriceTag price={12000000} short /><PriceTag /></div></Example>
    <Example name="SectionReveal">
      <Example name="delay"><div className="grid gap-4 sm:grid-cols-3">{[0, 0.1, 0.2].map((seconds) => <div key={seconds} data-reveal="up" style={delay(seconds)} className="rounded-card bg-bg-tint p-6">[DỮ LIỆU MẪU] Trễ {seconds}s</div>)}</div></Example>
    </Example>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Example name="TikTokIcon"><TikTokIcon className="h-8 w-8 text-fg" /></Example>
      <Example name="YouTubeIcon"><YouTubeIcon className="h-8 w-8 text-fg" /></Example>
      <Example name="FacebookIcon"><FacebookIcon className="h-8 w-8 text-fg" /></Example>
      <Example name="MessengerIcon"><MessengerIcon className="h-8 w-8 text-fg" /></Example>
      <Example name="ZaloIcon"><ZaloIcon className="h-8 w-8 text-fg" /></Example>
    </div>
  </main>;
}
