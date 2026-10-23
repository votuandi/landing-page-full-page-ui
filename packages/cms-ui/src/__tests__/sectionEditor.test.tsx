import { mount, button, click, setConfirm, type Mounted } from "./dom.ts";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, useState } from "react";
import { SectionListEditor, type SectionListEditorProps } from "../sections/SectionListEditor.tsx";
import { add, move, remove, setVariant, toggle, type EditableSection } from "../sections/ops.ts";

const initial: EditableSection[] = [
  { id: "hero", type: "hero", variant: "t12", enabled: true, anchor: "dau-trang" },
  { id: "calculator", type: "calculator", variant: "t15", enabled: false },
];
const cleanup: Mounted[] = [];
test("edit link without reorder", async () => {
  const m = await render({ can: { reorder: false, variantSwitch: false }, editHref: s => `/section/${s.id}` });
  assert.equal(m.container.querySelector('a[href="/section/hero"]')?.textContent, "Sửa nội dung");
});
afterEach(() => { cleanup.splice(0).forEach(m => m.unmount()); setConfirm(true); });
async function render(extra: Partial<SectionListEditorProps> = {}) {
  let last = initial;
  function Controlled() {
    const [value, setValue] = useState(initial);
    return <SectionListEditor value={value} onChange={next => { last = next; setValue(next); }} can={{ reorder: true, variantSwitch: true }}
      allowedTypes={["hero", "calculator", "projects"]} newId={type => `${type}-new`} {...extra} />;
  }
  const mounted = await mount(<Controlled />); cleanup.push(mounted);
  return { ...mounted, last: () => last };
}

test("operations preserve optional fields and input, ignore invalid moves and keep IDs unique", () => {
  const original = structuredClone(initial);
  assert.deepEqual(move(initial, 0, 1), [initial[1], initial[0]]);
  assert.deepEqual(move(initial, -1, 1), initial);
  assert.deepEqual(move(initial, 0, 2), initial);
  assert.deepEqual(toggle(initial, "missing"), initial);
  assert.equal(toggle(initial, "hero")[0].enabled, false);
  assert.deepEqual(setVariant(initial, "hero", "t15")[0], { ...initial[0], variant: "t15" });
  assert.equal(add(initial, initial[0]).length, 2);
  assert.deepEqual(remove(initial, "calculator"), [initial[0]]);
  assert.deepEqual(initial, original);
});
test("locks add at maxPerPage", async () => {
  const { container, last } = await render();
  assert.equal(button(container, "Thêm Dự toán chi phí").disabled, true);
  await click(button(container, "Thêm Dự toán chi phí")); assert.deepEqual(last(), initial);
});
test("overflow shows alert and controlled values follow external replacement", async () => {
  const m = await render({ value: [...initial, { ...initial[1], id: "calculator2" }] });
  assert.match(m.container.querySelector('[role="alert"]')!.textContent!, /tối đa 1/);
  await act(async () => m.root.render(<SectionListEditor value={[]} onChange={() => {}} can={{ reorder: true, variantSwitch: true }} allowedTypes={["calculator"]} />));
  assert.equal(m.container.querySelectorAll("li[data-section-id]").length, 0);
  assert.equal(button(m.container, "Thêm Dự toán chi phí").disabled, false);
});
test("read-only without reorder", async () => {
  const { container } = await render({ can: { reorder: false, variantSwitch: false } });
  assert.equal(container.querySelectorAll('[role="switch"],button').length, 0);
  assert.equal(container.querySelectorAll("li[data-section-id]").length, 2);
});
test("hides variant menu without variantSwitch", async () => {
  const { container } = await render({ can: { reorder: true, variantSwitch: false } });
  assert.equal(container.querySelectorAll("select").length, 0);
});
test("locked types cannot be added", async () => {
  const { container } = await render({ lockedTypes: ["shorts"] });
  const locked = button(container, "Thêm Video công trình");
  assert.equal(locked.disabled, true); assert.equal(locked.getAttribute("aria-disabled"), "true");
});

test("nút Nâng cấp gọi feature của section khóa kể cả khi không được sắp xếp", async () => {
  for (const reorder of [true, false]) {
    let feature = "";
    const m = await render({ can: { reorder, variantSwitch: true }, lockedTypes: ["shorts"], onUpgrade: value => { feature = value; } });
    await click(button(m.container, "Nâng cấp: Video công trình"));
    assert.equal(feature, "shorts");
  }
});

test("hàng lockedByPlan không cho bật/sửa nhưng cho di chuyển và xóa", async () => {
  const m = await render({ lockedTypes: ["calculator"], editHref: s => `/section/${s.id}` });
  const row = m.container.querySelector<HTMLElement>('[data-section-id="calculator"]')!;
  assert.match(row.textContent!, /Khóa theo gói/);
  assert.equal(row.querySelector('[role="switch"],select,a'), null);
  await click(button(row, /^Lên trên:/));
  assert.equal(m.last()[0].id, "calculator");
  await click(button(row, /^Xóa:/));
  assert.equal(m.last().some(s => s.id === "calculator"), false);
});
test("reorders with buttons", async () => {
  const { container, last } = await render();
  assert.equal(button(container, /^Lên trên:.*\(hero\)$/).disabled, true);
  await click(button(container, /^Xuống dưới:.*\(hero\)$/));
  assert.deepEqual(last().map(s => s.id), ["calculator", "hero"]);
});
test("section rows share one motion listener and release it on unmount", async () => {
  const original = window.matchMedia;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const query = {
    matches: false, media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: EventListenerOrEventListenerObject) => { listeners.add(listener); },
    removeEventListener: (_: string, listener: EventListenerOrEventListenerObject) => { listeners.delete(listener); },
  };
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;
  let mounted: Mounted | undefined;
  try {
    mounted = await mount(<SectionListEditor value={initial} onChange={() => {}} can={{ reorder: true, variantSwitch: true }} allowedTypes={[]} />);
    assert.equal(listeners.size, 1);
    await act(async () => {
      query.matches = true;
      for (const listener of listeners) (listener as () => void)();
    });
    await act(async () => mounted!.root.render(<SectionListEditor value={[]} onChange={() => {}} can={{ reorder: true, variantSwitch: true }} allowedTypes={[]} />));
    assert.equal(listeners.size, 1);
    mounted.unmount(); mounted = undefined;
    assert.equal(listeners.size, 0);
  } finally {
    mounted?.unmount(); window.matchMedia = original;
  }
});
test("toggle, variant, add and confirmed remove keep section identity and content reference", async () => {
  const { container, last } = await render();
  await click(container.querySelector('[role="switch"]')!);
  assert.equal(last()[0].enabled, false);
  await click(container.querySelector('[data-section-id="hero"] input[type="radio"][value="t15"]')!);
  assert.equal(last()[0].variant, "t15"); assert.equal(last()[0].anchor, "dau-trang");
  await click(button(container, "Thêm Công trình đã thực hiện")); assert.equal(last().at(-1)?.id, "projects-new");
  setConfirm(false); await click(button(container, /^Xóa:.*\(hero\)$/)); assert.equal(last().length, 3);
  setConfirm(true); await click(button(container, /^Xóa:.*\(hero\)$/)); assert.equal(last().length, 2);
});

test("row, variant radio cards and add library use supplied theme thumbnail; failed image falls back", async () => {
  const m = await render({ thumbnail: (type, variant) => `/section-thumbs/t12/${type}--${variant}.webp` });
  const row = m.container.querySelector('[data-section-id="hero"]')!;
  assert.equal(row.querySelector('img')?.getAttribute('src'), '/section-thumbs/t12/hero--t12.webp');
  assert.equal(row.querySelector('input[type="radio"][value="t12"]')?.getAttribute('name'), row.querySelector('input[type="radio"][value="t15"]')?.getAttribute('name'));
  assert.ok(row.querySelector('fieldset legend')?.textContent?.includes("Kiểu hiển thị: Banner chính"));
  assert.ok(m.container.querySelector('button[aria-label="Thêm Công trình đã thực hiện"] img'));
  const preview = row.querySelector('img')!.parentElement!;
  await act(async () => preview.querySelector('img')!.dispatchEvent(new window.Event('error')));
  assert.equal(preview.querySelector('img'), null, "failed image is replaced, not left broken");
  assert.equal(preview.textContent, "t12");
});

test("restore keeps original id/variant and locks outside plan or maxPerPage", async () => {
  const removed = [{ id: "old-project", type: "projects", variant: "t15", enabled: true, expiresAt: "2026-11-01T00:00:00.000Z" },
    { id: "old-calc", type: "calculator", variant: "t15", enabled: true, expiresAt: "2026-11-01T00:00:00.000Z" },
    { id: "old-shorts", type: "shorts", variant: "t15", enabled: true, expiresAt: null }];
  const m = await render({ removed, lockedTypes: ["shorts"] });
  assert.equal(button(m.container, "Khôi phục: Dự toán chi phí (old-calc)").disabled, true);
  assert.equal(button(m.container, "Khôi phục: Video công trình (old-shorts)").disabled, true);
  await click(button(m.container, "Khôi phục: Công trình đã thực hiện (old-project)"));
  assert.equal(m.last().at(-1)?.id, "old-project"); assert.equal(m.last().at(-1)?.variant, "t15");
  assert.equal(m.container.querySelector('button[aria-label="Khôi phục: Công trình đã thực hiện (old-project)"]'), null);
});
