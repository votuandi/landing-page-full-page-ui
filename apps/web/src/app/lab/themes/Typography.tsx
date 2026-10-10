import type { ThemeTokens } from "@solar/tokens";
import TokenSection from "./TokenSection";

const scales = [
  "text-display-xl", "text-display-lg", "text-display-md", "text-display-sm", "text-display-xs",
  "text-xl", "text-lg", "text-base", "text-sm", "text-xs", "text-2xs",
] as const;
const sample = "[DỮ LIỆU MẪU] Năng lượng mặt trời — Điện sạch cho mọi công trình.";

export default function Typography({ theme }: { theme: ThemeTokens }) {
  return (
    <TokenSection id="chu" title="Typography" note={`Nguồn font: ${theme.font.source}`}>
      <div className="grid gap-4 md:grid-cols-2">
        {(["sans", "display"] as const).map((family) => (
          <article key={family} className="rounded-card border border-line/12 bg-bg-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-fg-subtle">{family}</p>
            <h3 className={`${family === "sans" ? "font-sans" : "font-display"} mt-1 text-display-xs font-bold text-fg`}>{theme.font[family]}</h3>
            <dl className="mt-4 divide-y divide-line/10">
              {theme.font.weights.map((weight) => (
                <div key={weight} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 py-2">
                  <dt className="font-mono text-xs text-fg-muted">{weight}</dt>
                  <dd className={family === "sans" ? "font-sans" : "font-display"} style={{ fontWeight: weight }}>{sample}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="divide-y divide-line/10 rounded-card border border-line/12 bg-bg-elevated px-5">
        {scales.map((scale) => (
          <div key={scale} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline sm:gap-4">
            <p className="font-mono text-xs text-fg-muted">{scale}</p>
            <p className={`${scale} truncate font-display font-bold leading-tight text-fg`} title={sample}>{sample}</p>
          </div>
        ))}
      </div>
    </TokenSection>
  );
}
