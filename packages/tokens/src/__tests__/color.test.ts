import assert from "node:assert/strict";
import { test } from "node:test";
import { colorChannelsToHex, hexToChannels } from "../color";

test("hex round-trip", () => {
  for (const hex of ["#000000", "#ffffff", "#aB120f"]) assert.equal(colorChannelsToHex(hexToChannels(hex)), hex.toLowerCase());
  for (const hex of ["red", "#fff", "#gg0000", "#ffffff;"]) assert.throws(() => hexToChannels(hex));
});

test("theme RGB channels become a padded CSS hex color for metadata", () => {
  assert.equal(colorChannelsToHex("245 250 246"), "#f5faf6");
  assert.equal(colorChannelsToHex("0 1 255"), "#0001ff");
});

test("rejects malformed or out-of-range channels", () => {
  for (const value of ["256 0 0", "-1 0 0", "1 2", "1 2 3 4", "1.5 2 3", "1 2 3; color:red"]) {
    assert.throws(() => colorChannelsToHex(value));
  }
});
