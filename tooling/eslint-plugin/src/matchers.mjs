const patterns = [
  ["arbitrary", /(?<![\w-])(?:bg|text|from|to|via|border|rounded(?:-[trblse]{1,2})?|shadow|font|fill|stroke)-\[[^\]\r\n]*(?:\]|$)/gi],
  ["hex", /(?<![\w&/])#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])/gi],
  ["color-fn", /\b(?:rgba?|hsla?)\((?!\s*var\(\s*--)/gi],
  ["palette", /(?<![\w-])(?:bg|text|from|to|via|border|ring|divide|outline|decoration|fill|stroke|shadow|accent|caret|placeholder)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?![\w-])/gi],
];

export function findHardcoded(text) {
  const matches = [];
  for (const [kind, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (matches.some((item) => item.kind === "arbitrary" && match.index >= item.index && match.index < item.index + item.found.length)) continue;
      matches.push({ index: match.index, found: match[0], kind });
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}

export function isAllowlisted(file) {
  const path = file.replaceAll("\\", "/");
  return /(?:^|\/)packages\/themes\//.test(path) || /(?:^|\/)brand-icons\//.test(path);
}

export function hasExemption(comment) {
  return /\btoken-exempt:\s*\S/.test(comment.replace(/\*\/$/, "").trim());
}

export function messageFor({ found, kind }) {
  let suggestion;
  if (kind === "arbitrary" && /^rounded-/i.test(found)) suggestion = "rounded-card, rounded-media, rounded-pill, rounded-input, rounded-button";
  else if (kind === "arbitrary" && /^shadow-/i.test(found)) suggestion = "shadow-sm, shadow-lg, shadow-xl, shadow-2xl";
  else if (kind === "arbitrary" && /^font-/i.test(found)) suggestion = "font-sans, font-display";
  else if (kind === "arbitrary" && /^text-\[[\d.]+(?:px|rem|em)\]/i.test(found)) suggestion = "thang fontSize của preset: text-2xs, text-xs, text-sm, text-display-sm";
  else if (kind === "hex" || kind === "color-fn") suggestion = "biến màu token: rgb(var(--c-primary) / α)";
  else suggestion = "class màu từ token: bg-primary, bg-accent, bg-bg-elevated, bg-bg-tint, text-fg, text-fg-muted, border-line";
  return `"${found}" viết cứng — dùng ${suggestion}.`;
}
