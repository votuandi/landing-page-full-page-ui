import type { ReactNode } from "react";
import type { Locale } from "../site";
import type { ClientLink } from "./links";
import { CalculatorLink } from "../render/CalculatorLink";

/** Lớp dùng chung của các variant t10 (template-10: nút tròn, thẻ kính, pill phân khúc). Chỉ token. */
export const T10 = {
  eyebrow: "inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-accent/60 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-secondary-deep backdrop-blur",
  heading: "mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] text-fg sm:text-5xl",
  sub: "mt-5 max-w-3xl text-base leading-8 text-fg-muted",
  button: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition",
  primary: "bg-primary text-on-primary hover:brightness-110 hover:shadow-lg",
  secondary: "border border-line/20 bg-bg-elevated text-primary hover:bg-bg-tint",
  card: "rounded-card border border-line/10 bg-bg-elevated/80 shadow-card backdrop-blur",
  pill: "min-h-11 rounded-full border border-line/25 bg-bg-elevated px-[18px] py-[9px] text-body-sm font-bold text-primary transition aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary",
  iconButton: "inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/15 bg-bg-elevated/80 text-primary hover:bg-bg-elevated",
} as const;

/** Nền hero/contact t10: hai quầng sky + mint trên nền mint nhạt. */
export const T10_GLOW = {
  background: "radial-gradient(ellipse at 95% 0%, rgb(var(--c-bg-sky)) 0, transparent 55%), radial-gradient(ellipse at 5% 90%, rgb(var(--c-accent-soft)) 0, transparent 50%), rgb(var(--c-bg-tint))",
};

/** Chuỗi giao diện chung (không phải nội dung tenant). */
export const T10_UI = {
  vi: { all: "Tất cả", prev: "Trước", next: "Tiếp theo", of: "trên", pause: "Tạm dừng chuyển động", play: "Tiếp tục chuyển động", filter: "Lọc", open: "Liên hệ nhanh", close: "Thu gọn", capacity: "Công suất", location: "Khu vực" },
  en: { all: "All", prev: "Previous", next: "Next", of: "of", pause: "Pause motion", play: "Resume motion", filter: "Filter", open: "Quick contact", close: "Collapse", capacity: "Capacity", location: "Location" },
} as const satisfies Record<Locale, Record<string, string>>;

export function T10Head({ id, eyebrow, title, desc, className = "mb-9" }: { id?: string; eyebrow?: string; title: string; desc?: string; className?: string }) {
  return (
    <div data-reveal="up" className={className}>
      {eyebrow && <p className={T10.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={T10.heading}>{title}</h2>
      {desc && <p className={T10.sub}>{desc}</p>}
    </div>
  );
}

/** Link đã resolve ở server; link dự toán mở calculator qua bus, link ngoài mở tab mới. */
export function T10Link({ link, className, onClick, children }: { link: Omit<ClientLink, "label">; className?: string; onClick?: () => void; children: ReactNode }) {
  if (link.calculator) return <CalculatorLink href={link.href} prefill={link.calculator} className={className}>{children}</CalculatorLink>;
  return <a href={link.href} className={className} onClick={onClick}
    target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>{children}</a>;
}
