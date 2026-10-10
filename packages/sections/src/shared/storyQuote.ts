import { prefillToSearch } from "@solar/core";
import type { Segment } from "@solar/core";
import type { Locale } from "../site";
import type { ClientLink } from "./links";

export function storyQuoteLink(story: { title: string; segment: Segment }, locale: Locale, label?: string): ClientLink {
  const calculator = { segment: story.segment, source: "story-cta", topic: `${locale === "en" ? "Similar project" : "Công trình tương tự"}: ${story.title}` };
  return { label: label ?? (locale === "en" ? "Get a quote for a similar project" : "Nhận báo giá công trình tương tự"), href: `?${prefillToSearch(calculator)}#du-toan`, external: false, calculator };
}
