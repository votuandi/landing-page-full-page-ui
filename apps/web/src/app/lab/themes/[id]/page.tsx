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
      <main className="mx-auto w-full space-y-8 px-4 py-12 text-fg sm:px-6 lg:px-8" style={{ maxWidth: "var(--container)" }}>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">Lab theme — {theme.meta.name}</h1>
          <p className="text-fg-muted">Xem token của theme. Dùng nút đổi giao diện ở header để xem chế độ sáng/tối.</p>
          <nav aria-label="Chọn theme" className="flex flex-wrap gap-3">
            {themes.map((item) => (
              <Link key={item.meta.id} href={`/lab/themes/${item.meta.id}`} aria-current={item.meta.id === theme.meta.id ? "page" : undefined} className="min-h-11 rounded-button border border-line/15 bg-bg-elevated px-4 py-3 text-sm text-fg hover:border-primary aria-[current=page]:border-primary">
                {item.meta.name} ({item.meta.id}) · {item.meta.group} · Chế độ tối: {item.meta.supportsDark ? "Có" : "Không"}
              </Link>
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
