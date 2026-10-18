import { mount } from "./dom.ts";
import { dom } from "./domGlobals.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
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
