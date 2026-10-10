import { test } from "node:test";
import assert from "node:assert/strict";
import { QUOTE_CART_KEY, readQuoteCart, addToQuoteCart, writeQuoteCart, onQuoteCartChange, openQuoteCart, onOpenQuoteCart } from "../quoteCartStore";

test("quote cart store persists, sanitizes, notifies and unsubscribes without React", () => {
  const values = new Map<string, string>();
  const target = new EventTarget();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(target, {
    localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) },
  }) });
  try {
    let changes = 0;
    let opens = 0;
    const stop = onQuoteCartChange(() => changes++);
    const close = onOpenQuoteCart(() => opens++);
    values.set(QUOTE_CART_KEY, JSON.stringify([{ sku: "panel", qty: 1 }, { sku: "panel", qty: 2 }, null]));
    assert.deepEqual(readQuoteCart(), [{ sku: "panel", qty: 3 }]);
    addToQuoteCart("panel", 2);
    assert.deepEqual(JSON.parse(values.get(QUOTE_CART_KEY)!), [{ sku: "panel", qty: 5 }]);
    openQuoteCart();
    assert.equal(changes, 1);
    assert.equal(opens, 1);
    stop(); close();
    writeQuoteCart([]); openQuoteCart();
    assert.equal(changes, 1);
    assert.equal(opens, 1);
    values.set(QUOTE_CART_KEY, "invalid JSON");
    assert.deepEqual(readQuoteCart(), []);
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
    addToQuoteCart("battery"); addToQuoteCart("battery", 2);
    assert.deepEqual(readQuoteCart(), [{ sku: "battery", qty: 3 }]);
    writeQuoteCart([]);
    assert.deepEqual(readQuoteCart(), []);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("quote cart store is safe on the server and never shares browser memory", () => {
  assert.deepEqual(readQuoteCart(), []);
  addToQuoteCart("server"); openQuoteCart();
  assert.deepEqual(readQuoteCart(), []);
  onQuoteCartChange(() => {})(); onOpenQuoteCart(() => {})();
});
