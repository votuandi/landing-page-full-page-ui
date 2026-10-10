import { z } from "zod";
import {
  CALCULATOR_ID, normalizeVnPhone, prefillFromSearch, prefillToSearch,
  type CalculatorPrefill,
} from "@solar/core";
import { localized } from "./localized";
import { fieldRegistry } from "./widget";

const pageSlug = /^(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;
const anchorId = /^[a-z0-9-]+$/;

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function link() {
  return z.object({
    kind: z.enum(["page", "url", "anchor", "phone", "zalo", "calculator"]),
    value: z.string(),
    label: localized(),
  }).superRefine(({ kind, value }, ctx) => {
    let valid = true;
    switch (kind) {
      case "page": valid = pageSlug.test(value); break;
      case "url": valid = isHttpUrl(value); break;
      case "anchor": valid = anchorId.test(value); break;
      case "phone":
      case "zalo": valid = /^\d{9,11}$/.test(normalizeVnPhone(value)); break;
      // calculatorBus bỏ qua tham số điền sẵn không hợp lệ và chỉ serialize trường đã biết.
      case "calculator": prefillFromSearch(value); break;
    }
    if (!valid) ctx.addIssue({ code: "custom", path: ["value"], message: "Giá trị liên kết không hợp lệ" });
  }).register(fieldRegistry, { widget: "link" });
}

export type Link = z.output<ReturnType<typeof link>>;
export type ResolvedLink = { href: string; external: boolean; calculator?: CalculatorPrefill };

export function resolveLink(link: Link): ResolvedLink {
  const { kind, value } = link;
  switch (kind) {
    case "page": return { href: pageSlug.test(value) ? `/${value}` : "#", external: false };
    case "url": return { href: isHttpUrl(value) ? value : "#", external: isHttpUrl(value) };
    case "anchor": return { href: anchorId.test(value) ? `#${value}` : "#", external: false };
    case "phone": return { href: `tel:${normalizeVnPhone(value)}`, external: false };
    case "zalo": return { href: `https://zalo.me/${normalizeVnPhone(value)}`, external: true };
    case "calculator": {
      const calculator = prefillFromSearch(value);
      const query = prefillToSearch(calculator);
      return { href: `/${query ? `?${query}` : ""}#${CALCULATOR_ID}`, external: false, calculator };
    }
    default: return { href: "#", external: false };
  }
}
