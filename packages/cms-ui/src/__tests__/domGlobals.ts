import { JSDOM } from "jsdom";

/** Nạp trước react-dom: react-dom kiểm tra DOM lúc khởi tạo module. */
export const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
const g = globalThis as Record<string, unknown>;
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement",
  "HTMLSelectElement", "HTMLButtonElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "getComputedStyle"]) {
  Object.defineProperty(g, key, { value: (dom.window as unknown as Record<string, unknown>)[key], configurable: true, writable: true });
}
g.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
g.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.matchMedia = ((query: string) => ({
  matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {},
})) as unknown as typeof dom.window.matchMedia;

