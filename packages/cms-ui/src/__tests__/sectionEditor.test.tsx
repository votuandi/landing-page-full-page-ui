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
test("reorders with buttons", async () => {
  const { container, last } = await render();
  assert.equal(button(container, /^Lên trên:.*\(hero\)$/).disabled, true);
  await click(button(container, /^Xuống dưới:.*\(hero\)$/));
  assert.deepEqual(last().map(s => s.id), ["calculator", "hero"]);
});
test("toggle, variant, add and confirmed remove keep section identity and content reference", async () => {
  const { container, last } = await render();
  await click(container.querySelector('[role="switch"]')!);
  assert.equal(last()[0].enabled, false);
  const select = container.querySelector("select")!;
  const { type } = await import("./dom.ts");
  await type(select, "t15"); assert.equal(last()[0].variant, "t15"); assert.equal(last()[0].anchor, "dau-trang");
  await click(button(container, "Thêm Công trình đã thực hiện")); assert.equal(last().at(-1)?.id, "projects-new");
  setConfirm(false); await click(button(container, /^Xóa:.*\(hero\)$/)); assert.equal(last().length, 3);
  setConfirm(true); await click(button(container, /^Xóa:.*\(hero\)$/)); assert.equal(last().length, 2);
});
