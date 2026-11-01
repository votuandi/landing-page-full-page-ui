import assert from "node:assert/strict";
import test from "node:test";
import { editedContents, fromPuck, snapshot, toPuck } from "../app/(admin)/trang/[pageId]/builder/puckAdapter.ts";

const sections = [
  { id: "a", type: "hero", variant: "t15", enabled: true, anchor: "dau-trang" },
  { id: "b", type: "stats", variant: "t12", enabled: false },
] as Parameters<typeof toPuck>[0];
const contents = { a: { title: "x" }, b: { items: [] } };

test("khứ hồi giữ id, thứ tự và mọi trường descriptor", () => {
  assert.deepEqual(fromPuck(toPuck(sections, contents)), sections);
});
test("descriptor không mang props nội dung", () => {
  assert.ok(fromPuck(toPuck(sections, contents)).every(section => !("data" in section)));
});
test("chỉ gửi section có nội dung đổi", () => {
  const data = toPuck(sections, contents), saved = snapshot(data);
  assert.deepEqual(editedContents(data, saved), {});
  data.content[0]!.props.data = { title: "y" };
  assert.deepEqual(editedContents(data, saved), { a: { title: "y" } });
});
