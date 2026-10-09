import type { Text } from "@/config/site.config";

export type Lang = "vi" | "en";

/** Chọn chuỗi theo ngôn ngữ — module thường (không "use client") nên dùng được cả ở server component. */
export function pickText(text: Text, lang: Lang, en?: string) {
  if (typeof text !== "string") return text[lang] || text.vi;
  return lang === "en" && en ? en : text;
}
