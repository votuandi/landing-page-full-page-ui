import { mount } from "../../../../../../packages/cms-ui/src/__tests__/dom.ts";
import { dom } from "../../../../../../packages/cms-ui/src/__tests__/domGlobals.ts";
import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act, createElement, createRef } from "react";
import BuilderCanvas, { type BuilderCanvasHandle } from "../../../components/preview/BuilderCanvas.tsx";

test("canvas handle kéo thư viện, hủy và chèn cuối trang trống; không có reorder thì bỏ qua", async () => {
  const globals = globalThis as Record<string, unknown>;
  const names = ["React", "Element", "ResizeObserver", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = Object.fromEntries(names.map(name => [name, globals[name]]));
  const frames = new Map<number, FrameRequestCallback>(); let sequence = 0, scrolls = 0;
  Object.assign(globals, { React, Element: dom.window.Element, MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const originalScroll = window.scrollTo; window.scrollTo = () => { scrolls++; };
  const main = document.createElement("main"), faq = document.createElement("section");
  faq.dataset.sectionId = "faq";
  faq.getBoundingClientRect = () => ({ top: 400, bottom: 800, height: 400, left: 0, right: 390, width: 390, x: 0, y: 400, toJSON() {} });
  main.append(faq); document.body.append(main);
  const handle = createRef<BuilderCanvasHandle>();
  const props = { handle, selectedId: null, reorder: true, onSelect() {}, onEvent() {} };
  const mounted = await mount(createElement(BuilderCanvas, props));
  try {
    await act(async () => { handle.current!.dragAt(420); });
    assert.ok(mounted.container.querySelector("[data-builder-drop]"));
    let destination: unknown;
    await act(async () => { destination = handle.current!.drop(700); });
    assert.deepEqual(destination, { targetId: "faq", position: "after", top: 800 });
    assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
    for (let round = 1; round <= 2; round++) {
      await act(async () => { handle.current!.dragAt(window.innerHeight - 1); });
      await act(async () => { const queued = [...frames]; frames.clear(); queued.forEach(([, callback]) => callback(0)); });
      assert.equal(scrolls, round);
      await act(async () => { handle.current!.cancel(); });
      assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
    }
    faq.remove();
    await act(async () => { handle.current!.dragAt(100); destination = handle.current!.drop(100); });
    assert.equal(destination, null);
    main.append(faq);
    await act(async () => mounted.root.render(createElement(BuilderCanvas, { ...props, reorder: false })));
    await act(async () => { handle.current!.dragAt(420); destination = handle.current!.drop(420); });
    assert.equal(destination, null); assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
  } finally { mounted.unmount(); main.remove(); window.scrollTo = originalScroll; Object.assign(globals, originals); }
});

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
