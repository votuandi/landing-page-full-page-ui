"use client";

import { ChatBubbleLeftRightIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { MessengerIcon, ZaloIcon } from "@/components/BrandIcons";
import { openConsult } from "@/components/ConsultPopup";

type Item = { key: string; label: string; href?: string; onClick?: () => void; Icon: (p: { className?: string }) => React.ReactNode; tone: string; external: boolean };

/**
 * Liên hệ nhanh: nút nổi góc phải (desktop) + thanh đáy (mobile, chỉ khi tắt mobileBottomNav trong config).
 * Gọi / Zalo / Messenger lấy từ config — mục nào không có link sẽ KHÔNG render. Nút "Tư vấn" mở popup form ngắn.
 */
export default function ContactDock() {
  const { tr } = useLang();
  const { phone, phoneRaw, zalo, messenger } = SITE_CONFIG.contact;
  const items = [
    { key: "consult", label: tr("Nhận tư vấn", "Get advice"), onClick: openConsult, Icon: ChatBubbleLeftRightIcon, tone: "bg-bg-elevated text-primary border border-primary/20", external: false },
    phoneRaw && { key: "call", label: phone, href: `tel:${phoneRaw}`, Icon: PhoneIcon, tone: "bg-primary text-on-primary", external: false },
    zalo && { key: "zalo", label: "Chat Zalo", href: zalo, Icon: ZaloIcon, tone: "bg-secondary text-on-secondary", external: true },
    messenger && { key: "messenger", label: "Messenger", href: messenger, Icon: MessengerIcon, tone: "bg-bg-elevated text-fg border border-line/15", external: true },
  ].filter(Boolean) as Item[];

  const ext = (external: boolean) => (external ? { target: "_blank", rel: "noopener noreferrer" } : {});
  const cls = (tone: string) => `group flex h-14 items-center gap-2 overflow-hidden rounded-full px-4 shadow-[0_18px_50px_-20px_rgb(var(--c-shadow)/.45)] transition hover:-translate-y-0.5 ${tone}`;
  const label = "max-w-0 whitespace-nowrap text-sm font-black opacity-0 transition-all duration-300 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:max-w-48 group-focus-visible:opacity-100";

  return (
    <>
      {!siteConfig.mobileBottomNav.enabled && (
        <nav aria-label={tr("Liên hệ nhanh", "Quick contact")} className="fixed inset-x-3 bottom-3 z-40 grid gap-2 rounded-full border border-line/10 bg-bg-elevated/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, marginBottom: "env(safe-area-inset-bottom)" }}>
          {items.map(({ key, label: text, href, onClick, Icon, tone, external }) => {
            const c = `flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-black ${tone}`;
            return href ? <a key={key} href={href} {...ext(external)} className={c}><Icon className="h-4 w-4" /><span className="truncate">{key === "call" ? tr("Gọi", "Call") : text}</span></a>
              : <button key={key} type="button" onClick={onClick} className={c}><Icon className="h-4 w-4" /><span className="truncate">{text}</span></button>;
          })}
        </nav>
      )}
      <nav aria-label={tr("Liên hệ nhanh", "Quick contact")} className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 lg:flex">
        {items.map(({ key, label: text, href, onClick, Icon, tone, external }) => href
          ? <a key={key} href={href} {...ext(external)} aria-label={key === "call" ? `${tr("Gọi", "Call")} ${text}` : text} className={cls(tone)}><Icon className="h-6 w-6 shrink-0" /><span className={label}>{text}</span></a>
          : <button key={key} type="button" onClick={onClick} aria-label={text} className={cls(tone)}><Icon className="h-6 w-6 shrink-0" /><span className={label}>{text}</span></button>)}
      </nav>
    </>
  );
}
