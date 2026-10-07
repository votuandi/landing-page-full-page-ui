import { PhoneIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { MessengerIcon, ZaloIcon } from "@/components/BrandIcons";

/**
 * Liên hệ nhanh: nút nổi góc phải (desktop) + thanh đáy (mobile, chỉ khi tắt mobileBottomNav trong config).
 * Link lấy từ config; mục nào không có link sẽ KHÔNG render.
 */
export default function ContactDock() {
  const { phoneRaw, zalo, messenger } = SITE_CONFIG.contact;
  const items = [
    phoneRaw && { key: "call", label: "Gọi ngay", href: `tel:${phoneRaw}`, Icon: PhoneIcon, tone: "bg-primary text-on-primary", external: false },
    zalo && { key: "zalo", label: "Chat Zalo", href: zalo, Icon: ZaloIcon, tone: "bg-accent text-on-accent", external: true },
    messenger && { key: "messenger", label: "Messenger", href: messenger, Icon: MessengerIcon, tone: "bg-glass-strong text-fg border border-glass-strong-border", external: true },
  ].filter(Boolean) as { key: string; label: string; href: string; Icon: (p: { className?: string }) => React.ReactNode; tone: string; external: boolean }[];

  if (!items.length) return null;
  const ext = (external: boolean) => (external ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <>
      {!siteConfig.mobileBottomNav.enabled && <nav aria-label="Liên hệ nhanh" className="fixed inset-x-3 bottom-3 z-40 grid gap-2 rounded-full border border-glass-border bg-bg-elevated/75 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {items.map(({ key, label, href, Icon, tone, external }) => (
          <a key={key} href={href} {...ext(external)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-black ${tone}`}>
            <Icon className="h-4 w-4" />{label}
          </a>
        ))}
      </nav>}
      <nav aria-label="Liên hệ nhanh" className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 lg:flex">
        {items.map(({ key, label, href, Icon, tone, external }) => (
          <a key={key} href={href} {...ext(external)} aria-label={label} className={`group flex h-14 items-center gap-2 overflow-hidden rounded-full px-4 shadow-[0_18px_50px_-20px_rgb(var(--c-shadow)/.35)] backdrop-blur-xl transition hover:-translate-y-0.5 ${tone}`}>
            <Icon className="h-6 w-6 shrink-0" />
            <span className="max-w-0 whitespace-nowrap text-sm font-black opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100">{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
