import { COLOR_KEYS, GLASS_COLOR_KEYS, colorChannelsToHex, type ThemeTokens } from "@solar/tokens";
import TokenSection from "./TokenSection";

export default function ColorPalette({ theme }: { theme: ThemeTokens }) {
  const modes = theme.meta.supportsDark ? ["light", "dark"] as const : ["light"] as const;
  return (
    <TokenSection id="mau" title="Bảng màu">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...COLOR_KEYS, ...GLASS_COLOR_KEYS].map((key) => (
          <article key={key} className="rounded-card border border-line/15 bg-bg-elevated p-4">
            <h3 className="mb-3 break-words font-semibold">{key}</h3>
            <div className="grid grid-cols-2 gap-3">
              {modes.map((mode) => {
                const value = (mode === "dark" ? theme.colors.dark?.[key] : undefined) ?? theme.colors.light[key];
                const color = GLASS_COLOR_KEYS.some((glassKey) => glassKey === key) ? value : colorChannelsToHex(value);
                return (
                  <div key={mode} className="min-w-0 space-y-2">
                    <div aria-hidden="true" className="t15-dots overflow-hidden rounded-input border border-line/15">
                      <div className="h-16" style={{ backgroundColor: color }} />
                    </div>
                    <p className="text-sm font-semibold">{mode === "light" ? "Sáng" : "Tối"}</p>
                    <p className="break-words text-xs text-fg-muted">{value}</p>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </TokenSection>
  );
}
