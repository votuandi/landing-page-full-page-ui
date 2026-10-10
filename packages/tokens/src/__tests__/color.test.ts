import assert from "node:assert/strict";
import { test } from "node:test";
import { colorChannelsToHex } from "../color";

test("theme RGB channels become a padded CSS hex color for metadata", () => {
  assert.equal(colorChannelsToHex("245 250 246"), "#f5faf6");
  assert.equal(colorChannelsToHex("0 1 255"), "#0001ff");
});

test("rejects malformed or out-of-range channels", () => {
  for (const value of ["256 0 0", "-1 0 0", "1 2", "1 2 3 4", "1.5 2 3", "1 2 3; color:red"]) {
    assert.throws(() => colorChannelsToHex(value));
  }
});
