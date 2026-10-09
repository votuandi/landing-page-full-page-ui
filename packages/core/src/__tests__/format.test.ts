import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoneyShort, formatNumber, formatVnd, parseNumber } from "../format";

test("định dạng số và tiền: làm tròn, phần thập phân và các ngưỡng đơn vị", () => {
  assert.equal(formatNumber(1234.56), "1.235");
  assert.equal(formatNumber(1234.56, 2), "1.234,56");
  assert.equal(formatVnd(3_450_000), "3.450.000 ₫");
  assert.equal(formatMoneyShort(0), "0 đ");
  assert.equal(formatMoneyShort(999), "999 đ");
  assert.equal(formatMoneyShort(1000), "1 nghìn");
  assert.equal(formatMoneyShort(930_710), "931 nghìn");
  assert.equal(formatMoneyShort(1_234_000_000), "1,23 tỷ");
  for (const text of ["1.000.000", "1,000,000", "1000000", "1 000 000 ₫"]) {
    assert.equal(parseNumber(text), 1_000_000);
  }
  assert.equal(parseNumber(""), 0);
  assert.equal(parseNumber("không có số"), 0);
});
