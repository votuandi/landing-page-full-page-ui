import { mount, byPath, type as typeInput } from "../../../../packages/cms-ui/src/__tests__/dom.ts";
import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act, createElement, createRef, useState } from "react";
import { sectionRegistry } from "@solar/sections";
import BuilderPanel, { type BuilderPanelHandle } from "../app/(admin)/trang/[pageId]/builder/BuilderPanel.tsx";
import type { PageSectionResult } from "../lib/pageSections.ts";

// tsx uses classic JSX for workspace sources imported through the admin app.
Object.assign(globalThis, { React });

async function setup(save: () => Promise<PageSectionResult>) {
  const ref = createRef<BuilderPanelHandle>();
  let dirty = false, disable!: () => void;
  const onDirty = (value: boolean) => { dirty = value; };
  function Harness() {
    const [data, setData] = useState<unknown>(sectionRegistry.types.hero.defaults);
    const [disabled, setDisabled] = useState(false); disable = () => setDisabled(true);
    return createElement(BuilderPanel, { ref, section: { id: "hero", type: "hero", variant: "t12", enabled: true },
      form: { data, recovered: false, readOnly: undefined }, bilingual: false, disabled, onChange: setData, save, onDirty });
  }
  const mounted = await mount(createElement(Harness));
  return { mounted, ref, dirty: () => dirty, disable: async () => { await act(async () => disable()); } };
}
test("panel giữ nháp sai, flush không ghi nội dung sai", async () => {
  let writes = 0;
  const s = await setup(async () => { writes++; return { ok: true, revision: 3 }; });
  try {
    await typeInput(byPath(s.mounted.container, "stats.0.value"), "sai");
    let result!: { ok: boolean };
    await act(async () => { result = await s.ref.current!.flush(); });
    assert.equal(result.ok, false); assert.equal(writes, 0); assert.equal(s.dirty(), true);
    assert.equal(byPath(s.mounted.container, "stats.0.value").value, "sai");
  } finally { s.mounted.unmount(); }
});
test("panel flush nháp trước khi unmount, lưu lỗi giữ nháp để thử lại", async () => {
  let writes = 0;
  const s = await setup(async () => ++writes === 1 ? { ok: false, error: "Không thể lưu" } : { ok: true, revision: 3 });
  try {
    await typeInput(byPath(s.mounted.container, "badge"), "Nội dung mới");
    let result!: { ok: boolean };
    await act(async () => { result = await s.ref.current!.flush(); });
    assert.equal(result.ok, false); assert.equal(s.dirty(), true);
    await act(async () => { result = await s.ref.current!.flush(); });
    assert.equal(result.ok, true); assert.equal(s.dirty(), false); assert.equal(writes, 2);
  } finally { s.mounted.unmount(); }
});
test("panel vẫn cảnh báo nháp chưa lưu khi 409 khóa builder", async () => {
  const s = await setup(async () => ({ ok: false, status: 409, error: "Trang đã thay đổi" }));
  try {
    await typeInput(byPath(s.mounted.container, "badge"), "Nháp cần giữ");
    await act(async () => { await s.ref.current!.flush(); });
    await s.disable();
    assert.equal(s.dirty(), true);
    assert.equal(byPath(s.mounted.container, "badge").value, "Nháp cần giữ");
  } finally { s.mounted.unmount(); }
});

test("flush chờ lần lưu đang chạy dù form đã quay về giá trị ban đầu", async () => {
  let release!: () => void, writes = 0;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const s = await setup(async () => { if (++writes === 1) await pending; return { ok: true, revision: writes + 2 }; });
  try {
    const original = byPath(s.mounted.container, "badge").value;
    await typeInput(byPath(s.mounted.container, "badge"), "Đang ghi");
    let first!: ReturnType<BuilderPanelHandle["flush"]>;
    await act(async () => { first = s.ref.current!.flush(); });
    assert.equal(writes, 1);
    await typeInput(byPath(s.mounted.container, "badge"), original);
    let completed = false, second!: ReturnType<BuilderPanelHandle["flush"]>;
    await act(async () => { second = s.ref.current!.flush().then(result => { completed = true; return result; }); });
    assert.equal(completed, false, "history must wait for every outstanding content write");
    await act(async () => { release(); await Promise.all([first, second]); });
    assert.equal(writes, 2); assert.equal(s.dirty(), false);
  } finally { release(); s.mounted.unmount(); }
});
