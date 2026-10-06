import { PhoneIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG, primaryHotline, telHref } from "@/config/site";
import { MessengerIcon, ZaloIcon } from "@/components/BrandIcons";

type Item = { key: string; label: string; href: string; Icon: (p: { className?: string }) => React.ReactNode; tone: string; external: boolean };

/**
 * Liên hệ nhanh: thanh cố định đáy màn hình (mobile) + nút nổi góc phải (desktop).
 * Gọi = hotline đầu tiên trong config. Mục nào không có link sẽ KHÔNG render.
 */
export default function ContactDock() {
  const { zalo, messenger } = SITE_CONFIG.contact;
  const items = [
    primaryHotline && { key: "call", label: "Gọi", href: telHref(primaryHotline.phone), Icon: PhoneIcon, tone: "bg-primary text-on-primary", external: false },
    zalo && { key: "zalo", label: "Zalo", href: zalo, Icon: ZaloIcon, tone: "bg-accent text-on-accent", external: true },
    messenger && { key: "messenger", label: "Messenger", href: messenger, Icon: MessengerIcon, tone: "border border-line/15 bg-bg-elevated text-fg", external: true },
  ].filter(Boolean) as Item[];

  if (!items.length) return null;
  const ext = (external: boolean) => (external ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <>
      <nav aria-label="Liên hệ nhanh" className="fixed inset-x-3 bottom-3 z-40 grid gap-2 rounded-full border border-on-media/70 bg-bg-elevated/75 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, marginBottom: "env(safe-area-inset-bottom)" }}>
        {items.map(({ key, label, href, Icon, tone, external }) => (
          <a key={key} href={href} {...ext(external)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-black min-[400px]:text-sm ${tone}`}>
            <Icon className="h-4 w-4" />{label}
          </a>
        ))}
      </nav>
      <nav aria-label="Liên hệ nhanh" className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 lg:flex">
        {items.map(({ key, label, href, Icon, tone, external }) => (
          <a key={key} href={href} {...ext(external)} aria-label={key === "call" && primaryHotline ? `Gọi ${primaryHotline.phone}` : label}
            className={`group flex h-14 items-center gap-2 overflow-hidden rounded-full px-4 shadow-[0_18px_50px_-20px_rgb(var(--c-shadow)/.35)] backdrop-blur-xl transition hover:-translate-y-0.5 ${tone}`}>
            <Icon className="h-6 w-6 shrink-0" />
            <span className="max-w-0 whitespace-nowrap text-sm font-black opacity-0 transition-all duration-300 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:max-w-48 group-focus-visible:opacity-100">
              {key === "call" && primaryHotline ? primaryHotline.phone : label}
            </span>
          </a>
        ))}
      </nav>
    </>
  );
}
