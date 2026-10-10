import { CALCULATOR_ID, prefillToSearch, type CalculatorPrefill, type Segment } from "@solar/core";

export function withSegmentParam(search: string, segment: Segment | null): string {
  const query = new URLSearchParams(search);
  if (segment) query.set("phan-khuc", segment);
  else query.delete("phan-khuc");
  const value = query.toString();
  return value ? `?${value}` : "";
}

export type CalculatorAction = { kind: "bus" } | { kind: "navigate"; href: string } | { kind: "consult" };

export function resolveCalculatorAction(onPage: boolean, calculatorHref: string | null | undefined, prefill: CalculatorPrefill): CalculatorAction {
  if (onPage) return { kind: "bus" };
  const href = calculatorHref === undefined ? "/" : calculatorHref;
  // Backslashes and control characters can turn a local path into another origin in a browser.
  if (!href || !href.startsWith("/") || href.startsWith("//") || /[\\\u0000-\u0020]/.test(href)) return { kind: "consult" };
  const query = prefillToSearch(prefill);
  return { kind: "navigate", href: `${href}${query ? `?${query}` : ""}#${CALCULATOR_ID}` };
}
