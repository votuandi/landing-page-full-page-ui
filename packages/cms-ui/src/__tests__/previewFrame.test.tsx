import { mount } from "./dom.ts";
import { dom } from "./domGlobals.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { PreviewFrame } from "../preview/PreviewFrame.tsx";
test("PreviewFrame authenticates source and origin, scrolls on ready and refreshes without replacing src", async () => {
  let updates = 0;
  const props = { src: "http://localhost/frame", title: "Xem trước nội dung", sectionId: "hero", targetOrigin: "http://localhost", onUpdated: () => { updates++; } };
  const m = await mount(<PreviewFrame {...props} refreshKey={0} />);
  try {
    const frame = m.container.querySelector("iframe")!, source = frame.contentWindow!;
    const sent: unknown[] = []; source.postMessage = (data: unknown, origin: unknown) => { sent.push({ data, origin }); };
    const receive = (action: string, origin = "http://localhost", from: Window = source) => window.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "solar-preview", action }, origin, source: from }));
    receive("updated", "http://evil.test"); receive("updated", "http://localhost", window); assert.equal(updates, 0);
    receive("ready"); assert.deepEqual(sent[0], { data: { type: "solar-preview", action: "scroll", sectionId: "hero" }, origin: "http://localhost" });
    await act(async () => m.root.render(<PreviewFrame {...props} refreshKey={1} />));
    assert.deepEqual(sent.at(-1), { data: { type: "solar-preview", action: "refresh", sectionId: "hero" }, origin: "http://localhost" });
    assert.equal(m.container.querySelector("iframe"), frame); receive("updated"); assert.equal(updates, 1);
  } finally { m.unmount(); }
});
test("chỉ gán src một lần", async () => {
  const props = { src: "http://localhost/one-use-token", title: "Xem trước trang", sectionId: "", targetOrigin: "http://localhost", refreshKey: 0 };
  assert.doesNotMatch(renderToString(<PreviewFrame {...props} />), /one-use-token/);
  const original = dom.window.HTMLIFrameElement.prototype.setAttribute;
  let loads = 0;
  dom.window.HTMLIFrameElement.prototype.setAttribute = function (name, value) { if (name === "src") loads++; original.call(this, name, value); };
  const m = await mount(<StrictMode><PreviewFrame {...props} /></StrictMode>);
  try {
    await act(async () => m.root.render(<StrictMode><PreviewFrame {...props} refreshKey={1} /></StrictMode>));
    assert.equal(loads, 1);
  } finally { m.unmount(); dom.window.HTMLIFrameElement.prototype.setAttribute = original; }
});
test("sectionId rỗng vẫn gửi refresh", async () => {
  const props = { src: "http://localhost/frame", title: "Xem trước trang", sectionId: "", targetOrigin: "http://localhost", refreshKey: 0 };
  const m = await mount(<PreviewFrame {...props} />);
  try {
    const source = m.container.querySelector("iframe")!.contentWindow!, sent: unknown[] = [];
    source.postMessage = data => { sent.push(data); };
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "solar-preview", action: "ready" }, origin: props.targetOrigin, source }));
    await act(async () => m.root.render(<PreviewFrame {...props} refreshKey={1} />));
    assert.deepEqual(sent.at(-1), { type: "solar-preview", action: "refresh" });
  } finally { m.unmount(); }
});
test("bỏ qua sự kiện builder từ origin hoặc source lạ", async () => {
  const events: unknown[] = [];
  const props = { src: "http://localhost/frame", title: "Xem trước trang", selectedId: "faq", targetOrigin: "http://localhost", refreshKey: 0, onEvent: (event: unknown) => events.push(event) };
  const m = await mount(<PreviewFrame {...props} />);
  try {
    const source = m.container.querySelector("iframe")!.contentWindow!, sent: unknown[] = [];
    source.postMessage = data => { sent.push(data); };
    const receive = (action: string, origin = props.targetOrigin, from = source) => window.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "solar-preview", action, sectionId: "faq" }, origin, source: from }));
    receive("select", "http://evil.test"); receive("visible", props.targetOrigin, window);
    assert.equal(events.length, 0);
    receive("ready"); assert.deepEqual(sent.at(-1), { type: "solar-preview", action: "select", sectionId: "faq" });
    receive("select"); assert.equal(events.length, 2);
  } finally { m.unmount(); }
});
test("gửi lại lựa chọn cũ khi form chặn đổi section, không nạp lại iframe", async () => {
  const props = { src: "http://localhost/frame", title: "Xem trước trang", selectedId: "hero", selectionKey: 0, targetOrigin: "http://localhost", refreshKey: 0 };
  const m = await mount(<PreviewFrame {...props} />);
  try {
    const frame = m.container.querySelector("iframe")!, source = frame.contentWindow!, sent: unknown[] = [];
    source.postMessage = data => { sent.push(data); };
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "solar-preview", action: "ready" }, origin: props.targetOrigin, source }));
    sent.length = 0;
    await act(async () => m.root.render(<PreviewFrame {...props} selectionKey={1} />));
    assert.deepEqual(sent, [{ type: "solar-preview", action: "select", sectionId: "hero" }]);
    assert.equal(m.container.querySelector("iframe"), frame);
  } finally { m.unmount(); }
});
