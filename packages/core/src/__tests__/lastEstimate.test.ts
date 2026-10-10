import assert from "node:assert/strict";
import { test } from "node:test";
import { LAST_ESTIMATE_KEY, readLastEstimate, saveLastEstimate, sanitizeSavedEstimate } from "../lastEstimate";

const now = 1_800_000_000_000;
const saved = { savedAt: now, segment: "Trang trại", estimate: { kwp: 10, saving: "1.000.000", limited: false } };

test("saved estimate accepts flat values and expires after 30 days or a custom age", () => {
  assert.deepEqual(sanitizeSavedEstimate(saved, now), saved);
  assert.equal(sanitizeSavedEstimate(saved, now + 30 * 86_400_000 + 1), null);
  assert.equal(sanitizeSavedEstimate(saved, now + 101, 100), null);
});

test("saved estimate rejects malformed timestamps, segments and nested or non-finite values", () => {
  for (const value of [null, [], {}, { ...saved, savedAt: "today" }, { ...saved, savedAt: Infinity },
    { ...saved, savedAt: now + 1 }, { ...saved, segment: 1 }, { ...saved, estimate: [] },
    { ...saved, estimate: null }, { ...saved, estimate: { kwp: NaN } }, { ...saved, estimate: { nested: {} } }]) {
    assert.equal(sanitizeSavedEstimate(value, now), null);
  }
});

test("estimate storage roundtrips, rejects bad JSON and tolerates blocked storage and SSR", () => {
  assert.equal(readLastEstimate(), null);
  saveLastEstimate(saved);
  const values = new Map<string, string>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) },
  } });
  try {
    const fresh = { ...saved, savedAt: Date.now() };
    saveLastEstimate(fresh);
    assert.deepEqual(readLastEstimate(), fresh);
    values.set(LAST_ESTIMATE_KEY, "broken JSON");
    assert.equal(readLastEstimate(), null);
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
    assert.doesNotThrow(() => saveLastEstimate(fresh));
    assert.equal(readLastEstimate(), null);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
