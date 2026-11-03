import { mount } from "../../../../../../packages/cms-ui/src/__tests__/dom.ts";
import { dom } from "../../../../../../packages/cms-ui/src/__tests__/domGlobals.ts";
import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act, createElement } from "react";
import BuilderCanvas from "../../../components/preview/BuilderCanvas.tsx";

test("canvas tự cuộn ở mép trong cả hai lần kéo sau khi hủy", async () => {
  const globals = globalThis as Record<string, unknown>;
  const names = ["React", "Element", "ResizeObserver", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = Object.fromEntries(names.map(name => [name, globals[name]]));
  let sequence = 0, scrolls = 0;
  const frames = new Map<number, FrameRequestCallback>();
  Object.assign(globals, { React, Element: dom.window.Element, MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const originalScroll = window.scrollTo;
  window.scrollTo = () => { scrolls++; };
  const main = document.createElement("main");
  for (const [id, top] of [["hero", 0], ["faq", 500]] as const) {
    const section = document.createElement("div"); section.dataset.sectionId = id; section.dataset.sectionType = id;
    section.getBoundingClientRect = () => ({ top, bottom: top + 500, left: 0, right: 390, width: 390, height: 500, x: 0, y: top, toJSON() {} });
    main.append(section);
  }
  document.body.append(main);
  const mounted = await mount(createElement(BuilderCanvas, { selectedId: "hero", reorder: true, onSelect() {}, onEvent() {} }));
  const tick = async () => { await act(async () => {
    const queued = [...frames]; frames.clear(); for (const [, callback] of queued) callback(0);
  }); };
  const pointer = (target: EventTarget, type: string, clientY = 0) => {
    const event = new dom.window.MouseEvent(type, { bubbles: true, clientY, button: 0 });
    Object.defineProperty(event, "pointerId", { value: 1 }); target.dispatchEvent(event);
  };
  try {
    await tick();
    const handle = mounted.container.querySelector<HTMLButtonElement>("[data-builder-handle]")!;
    handle.setPointerCapture = () => {}; handle.hasPointerCapture = () => true; handle.releasePointerCapture = () => {};
    for (let round = 1; round <= 2; round++) {
      await act(async () => { pointer(handle, "pointerdown", 40); pointer(window, "pointermove", window.innerHeight - 1); });
      await tick();
      assert.equal(scrolls, round, "mỗi lần kéo phải tự cuộn được");
      await act(async () => { pointer(window, "pointercancel"); });
    }
  } finally {
    mounted.unmount(); main.remove(); window.scrollTo = originalScroll; Object.assign(globals, originals);
  }
});
