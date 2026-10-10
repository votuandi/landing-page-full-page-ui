import type { ThemeTokens } from "@solar/tokens";
import TokenSection from "./TokenSection";

const scales = [
  "text-display-xl", "text-display-lg", "text-display-md", "text-display-sm", "text-display-xs",
  "text-xl", "text-lg", "text-base", "text-sm", "text-xs", "text-2xs",
] as const;
const sample = "[DỮ LIỆU MẪU] Năng lượng mặt trời — Điện sạch cho mọi công trình.";

export default function Typography({ theme }: { theme: ThemeTokens }) {
  return (
    <TokenSection id="chu" title="Typography — Kiểu chữ">
      <p className="text-fg-muted">Nguồn: {theme.font.source}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["sans", "display"] as const).map((family) => (
          <article key={family} className="space-y-3 rounded-card border border-line/15 bg-bg-elevated p-4">
            <h3 className="font-semibold">{family}: {theme.font[family]}</h3>
            {theme.font.weights.map((weight) => (
              <div key={weight}>
                <p className="text-sm text-fg-muted">Độ đậm {weight}</p>
                <p className={family === "sans" ? "font-sans" : "font-display"} style={{ fontWeight: weight }}>{sample}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
      <div className="space-y-4 rounded-card border border-line/15 bg-bg-elevated p-4">
        <h3 className="font-semibold">Thang kích thước</h3>
        {scales.map((scale) => (
          <div key={scale}>
            <p className="text-xs text-fg-muted">{scale}</p>
            <p className={`${scale} break-words`}>{sample}</p>
          </div>
        ))}
      </div>
    </TokenSection>
  );
}
