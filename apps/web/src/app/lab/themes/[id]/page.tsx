import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { getTheme, themes, themeFontCss, themeFontFiles } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import ColorPalette from "../ColorPalette";
import Typography from "../Typography";
import TokenSamples from "../TokenSamples";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const theme = getTheme((await params).id);
  if (!theme) notFound();
  return { title: `Lab theme — ${theme.meta.name}` };
}

export default async function ThemeLabPage({ params }: Props) {
  const theme = getTheme((await params).id);
  if (!theme) notFound();
  for (const file of themeFontFiles(theme)) preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    <>
      <style>{themeToCss(theme) + themeFontCss(theme)}</style>
      <main className="mx-auto w-full space-y-10 px-4 py-12 text-fg sm:px-6 md:py-16 lg:px-8" style={{ maxWidth: "var(--container)" }}>
        <header className="space-y-5">
          <p className="t15-eyebrow">Lab · {theme.meta.id} · {theme.meta.group}</p>
          <h1 className="text-display-sm font-black tracking-tight text-fg sm:text-display-lg">{theme.meta.name}</h1>
          <p className="max-w-2xl text-fg-muted">Toàn bộ token của theme trên một trang. Đổi sáng/tối bằng nút giao diện ở header{theme.meta.supportsDark ? "" : " (theme này chỉ có chế độ sáng)"}.</p>
          <nav aria-label="Chọn theme" className="flex flex-wrap gap-2">
            {themes.map((item) => (
              <Link key={item.meta.id} href={`/lab/themes/${item.meta.id}`} aria-current={item.meta.id === theme.meta.id ? "page" : undefined} className="t15-chip aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-on-primary">
                <span>{item.meta.name}</span>
                <span className="font-mono text-xs opacity-75">{item.meta.id}</span>
              </Link>
            ))}
          </nav>
          <nav aria-label="Mục lục token" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
            {[["mau", "Màu"], ["chu", "Chữ"], ["bo-goc", "Bo góc"], ["kinh", "Kính"], ["bong", "Bóng"], ["motion", "Chuyển động"], ["density", "Mật độ"], ["sections", "Section"]].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center text-fg-muted underline-offset-4 hover:text-primary hover:underline">{label}</a>
            ))}
          </nav>
        </header>
        <ColorPalette theme={theme} />
        <Typography theme={theme} />
        <TokenSamples theme={theme} />
      </main>
    </>
  );
}
