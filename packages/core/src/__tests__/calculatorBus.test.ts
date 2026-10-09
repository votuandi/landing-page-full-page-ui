import { test } from "node:test";
import assert from "node:assert/strict";
import { prefillFromSearch, prefillToSearch } from "../calculatorBus";

test("calculator bus: query điền sẵn round-trip giữ phân khúc, tiền và nội dung tiếng Việt", () => {
  const prefill = { segment: "shop" as const, bill: 8_000_000, topic: "Cửa hàng & chuỗi · lưu trữ", source: "story-cta" };
  const search = prefillToSearch(prefill);
  assert.equal(new URLSearchParams(search).get("phan-khuc"), "shop");
  assert.deepEqual(prefillFromSearch(search), prefill);
  assert.deepEqual(prefillFromSearch(`?${search}`), prefill);
});

test("calculator bus: query rỗng không tạo dấu hỏi, vẫn nhận slug URL cũ", () => {
  assert.equal(prefillToSearch({}), "");
  assert.deepEqual(prefillFromSearch(""), { segment: undefined, bill: undefined, topic: undefined, source: undefined });
  assert.equal(prefillFromSearch("phan-khuc=ho-gia-dinh").segment, "household");
  assert.equal(prefillFromSearch("phan-khuc=wrong").segment, undefined);
});

test("calculator bus: tiền âm, bằng 0 hoặc không hữu hạn không được điền vào calculator", () => {
  for (const bill of ["-1", "0", "NaN", "Infinity", "text", ""]) {
    assert.equal(prefillFromSearch(`hoa-don=${bill}`).bill, undefined);
  }
  for (const bill of [-1, 0, NaN, Infinity]) {
    assert.equal(prefillToSearch({ bill }), "");
  }
});
