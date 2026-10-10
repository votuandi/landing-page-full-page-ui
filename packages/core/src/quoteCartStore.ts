import { addItem, sanitizeCart, type CartLine } from "./quoteCart";

export const QUOTE_CART_KEY = "t15-quote-cart";
const CHANGE = "t15:quote-cart-change";
const OPEN = "t15:open-quote-cart";
let memory: CartLine[] = [];
let storageFailed = false;

export function readQuoteCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  if (storageFailed) return sanitizeCart(memory);
  try {
    const raw = window.localStorage.getItem(QUOTE_CART_KEY);
    return raw ? sanitizeCart(JSON.parse(raw)) : sanitizeCart(memory);
  } catch {
    return sanitizeCart(memory);
  }
}

/** All writers share the same fallback and synchronous notification. */
export function writeQuoteCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  memory = sanitizeCart(lines);
  try { window.localStorage.setItem(QUOTE_CART_KEY, JSON.stringify(memory)); }
  catch { storageFailed = true; }
  window.dispatchEvent(new CustomEvent(CHANGE));
}

export function addToQuoteCart(sku: string, qty = 1) {
  writeQuoteCart(addItem(readQuoteCart(), sku, qty));
}

function listen(name: string, handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

export const onQuoteCartChange = (handler: () => void) => listen(CHANGE, handler);
export const onOpenQuoteCart = (handler: () => void) => listen(OPEN, handler);
export function openQuoteCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN));
}
