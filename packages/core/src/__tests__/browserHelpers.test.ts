import { test } from "node:test";
import assert from "node:assert/strict";
import { CALCULATOR_ID, openCalculator, onOpenCalculator, prefillFromUrl, scrollToSection } from "../index";

test("DOM helpers: điều hướng, điền sẵn/event, unsubscribe và reduced motion", (t) => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  let reducedMotion = false;
  let elementExists = false;
  const scrolls: ScrollIntoViewOptions[] = [];
  const browser = Object.assign(new EventTarget(), {
    location: { href: "", search: "?phan-khuc=trang-trai&hoa-don=25000000" },
    matchMedia: () => ({ matches: reducedMotion }),
  });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { getElementById: () => elementExists ? { scrollIntoView: (options: ScrollIntoViewOptions) => scrolls.push(options) } : null },
  });

  openCalculator();
  assert.equal(browser.location.href, `/#${CALCULATOR_ID}`);
  openCalculator({ segment: "shop", bill: 8_000_000, topic: "Cửa hàng", source: "story-cta" });
  const url = new URL(browser.location.href, "https://example.test");
  assert.equal(url.hash, "#du-toan");
  assert.equal(url.searchParams.get("hoa-don"), "8000000");
  assert.equal(url.searchParams.get("nguon"), "story-cta");
  assert.equal(prefillFromUrl().segment, "farm");
  assert.equal(prefillFromUrl().bill, 25_000_000);
  scrollToSection("video-cong-trinh", "factory");
  assert.equal(browser.location.href, "/?phan-khuc=factory#video-cong-trinh");
  scrollToSection("san-pham-noi-bat");
  assert.equal(browser.location.href, "/#san-pham-noi-bat");

  elementExists = true;
  const received: unknown[] = [];
  const unsubscribe = onOpenCalculator((prefill) => received.push(prefill));
  browser.dispatchEvent(new Event("t15:open-calculator"));
  openCalculator("household");
  reducedMotion = true;
  openCalculator({ segment: "farm", source: "story-cta" });
  unsubscribe();
  openCalculator("shop");
  assert.deepEqual(received, [{}, { segment: "household" }, { segment: "farm", source: "story-cta" }]);
  assert.deepEqual(scrolls[0], { behavior: "smooth", block: "start" });
  assert.deepEqual(scrolls[1], { behavior: "auto", block: "start" });
  scrollToSection("goi-giai-phap");
  assert.deepEqual(scrolls.at(-1), { behavior: "auto", block: "start" });
  reducedMotion = false;
  scrollToSection("cong-trinh");
  assert.deepEqual(scrolls.at(-1), { behavior: "smooth", block: "start" });
});
