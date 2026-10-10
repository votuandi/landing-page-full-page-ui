import { COLOR_KEYS, GLASS_COLOR_KEYS, colorChannelsToHex, type ThemeTokens } from "@solar/tokens";
import TokenSection from "./TokenSection";

const isGlass = (key: string) => GLASS_COLOR_KEYS.some((glassKey) => glassKey === key);

export default function ColorPalette({ theme }: { theme: ThemeTokens }) {
  const modes = theme.meta.supportsDark ? ["light", "dark"] as const : ["light"] as const;
  return (
    <TokenSection id="mau" title="Bảng màu" note={theme.meta.supportsDark ? "Mỗi ô: nửa trái sáng · nửa phải tối" : "Chỉ có chế độ sáng"}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {[...COLOR_KEYS, ...GLASS_COLOR_KEYS].map((key) => {
          const values = modes.map((mode) => (mode === "dark" ? theme.colors.dark?.[key] : undefined) ?? theme.colors.light[key]);
          return (
            <li key={key} className="min-w-0 overflow-hidden rounded-input border border-line/12 bg-bg-elevated">
              <div aria-hidden="true" className={`${isGlass(key) ? "t15-dots" : ""} flex h-14 border-b border-line/10`}>
                {values.map((value, i) => (
                  <div key={modes[i]} className="flex-1" style={{ backgroundColor: isGlass(key) ? value : colorChannelsToHex(value) }} />
                ))}
              </div>
              <div className="space-y-1 px-3 py-2.5">
                <p className="truncate text-sm font-bold text-fg" title={key}>{key}</p>
                {values.map((value, i) => (
                  <p key={modes[i]} className="flex gap-1.5 font-mono text-2xs leading-4 text-fg-muted">
                    <span className="shrink-0 font-bold text-fg-subtle">{modes[i] === "light" ? "S" : "T"}</span>
                    <span className="min-w-0 break-all">{isGlass(key) ? value.replace(/^rgba\(|\)$/g, "") : colorChannelsToHex(value)}</span>
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </TokenSection>
  );
}
