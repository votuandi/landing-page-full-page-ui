import { test } from "node:test";
import assert from "node:assert/strict";
import { isSegment, segmentFromParam, SEGMENT_ORDER, SEGMENT_SLUGS, SECTION_IDS } from "../segment";

test("phân khúc: nhận key và slug URL của cả bốn phân khúc", () => {
  for (const segment of SEGMENT_ORDER) {
    assert.ok(isSegment(segment));
    assert.equal(segmentFromParam(segment), segment);
    assert.equal(segmentFromParam(SEGMENT_SLUGS[segment]), segment);
  }
  assert.deepEqual(SEGMENT_SLUGS, {
    household: "ho-gia-dinh", shop: "cua-hang", factory: "nha-xuong", farm: "trang-trai",
  });
  assert.equal(SECTION_IDS.calculator, "du-toan");
});

test("phân khúc: bỏ key sai, prototype, null và giá trị không phải chuỗi", () => {
  for (const value of ["", "wrong", "constructor", "toString", null, undefined, 1, {}]) {
    assert.equal(isSegment(value), false);
  }
  for (const value of ["", "wrong", "constructor", "toString", null, undefined]) {
    assert.equal(segmentFromParam(value), null);
  }
});
