import Link from "next/link";
import type { ThemeTokens } from "@solar/tokens";
import TokenSection from "./TokenSection";

const radiusClasses = {
  card: "rounded-card", pill: "rounded-pill", media: "rounded-media",
  input: "rounded-input", button: "rounded-button",
} as const;
const durations = [
  ["durationFast", "duration-motion-fast"],
  ["durationBase", "duration-motion-base"],
  ["durationSlow", "duration-motion-slow"],
] as const;

export default function TokenSamples({ theme }: { theme: ThemeTokens }) {
  return (
    <>
      <TokenSection id="bo-goc" title="Bo góc">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(radiusClasses) as (keyof typeof radiusClasses)[]).map((key) => (
            <div key={key} className={`${radiusClasses[key]} border border-primary/25 bg-bg-tint p-6 text-center`}>
              <p className="font-semibold">{key}</p><p className="text-sm text-fg-muted">{theme.radius[key]}</p>
            </div>
          ))}
        </div>
      </TokenSection>
      <TokenSection id="kinh" title="Kính">
        <p className="text-fg-muted">Độ mờ: {theme.glass.blur}px · Bật: {theme.glass.enabled ? "Có" : "Không"}</p>
        <div className="t15-dots grid gap-4 rounded-card bg-bg-tint p-6 sm:grid-cols-2">
          {["t15-glass", "t15-glass-dark"].map((className) => (
            <div key={className} className={`${className} rounded-card p-6 backdrop-blur-glass`}>
              <p className="font-semibold">{className}</p><p>[DỮ LIỆU MẪU] Thẻ kính trên nền chấm.</p>
            </div>
          ))}
        </div>
      </TokenSection>
      <TokenSection id="bong" title="Bóng đổ">
        <p className="text-fg-muted">Cường độ: {theme.shadow.strength} · Token màu: {theme.shadow.tint}</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {["shadow-card", "shadow-card-hover", "shadow-glass", "shadow-lg"].map((className) => (
            <div key={className} className={`${className} rounded-card bg-bg-elevated p-6`}>{className}</div>
          ))}
        </div>
      </TokenSection>
      <TokenSection id="motion" title="Chuyển động">
        <p className="break-words text-fg-muted">Easing: {theme.motion.easing}</p>
        <p className="text-fg-muted">Khoảng reveal: {theme.motion.revealDistance}px · Bật reveal: {theme.motion.revealEnabled ? "Có" : "Không"}</p>
        <p className="text-sm text-fg-muted">Di chuột hoặc dùng Tab để xem chuyển động. Tôn trọng cài đặt giảm chuyển động.</p>
        <div className="space-y-4 overflow-hidden rounded-card border border-line/15 p-4">
          {durations.map(([key, className]) => (
            <button key={key} type="button" className={`${className} block rounded-button bg-primary px-4 py-3 text-on-primary transition-transform motion-safe:hover:translate-x-[var(--reveal-distance)] motion-safe:focus-visible:translate-x-[var(--reveal-distance)] motion-reduce:transition-none`} style={{ transitionTimingFunction: "var(--motion-ease)" }}>
              {key}: {theme.motion[key]}ms
            </button>
          ))}
        </div>
      </TokenSection>
      <TokenSection id="density" title="Mật độ bố cục">
        <p className="text-fg-muted">Container: {theme.density.container}px · Khoảng dọc section: {theme.density.sectionY}</p>
        <div className="rounded-card border border-line/15 bg-bg-tint px-4 py-section">[DỮ LIỆU MẪU] Khoảng dọc theo token sectionY.</div>
      </TokenSection>
      <TokenSection id="sections" title="Section đã port">
        <p>Chưa có section nào được port (E3)</p>
        <Link href="/lab/ui" className="inline-flex min-h-11 items-center text-primary underline">Xem primitive tại Lab UI</Link>
      </TokenSection>
    </>
  );
}
