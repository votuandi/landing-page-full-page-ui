import assert from "node:assert/strict";
import test from "node:test";
import { decryptSecret, encryptSecret, needsRotation } from "../secrets.ts";
const oldKey = Buffer.alloc(32, 1).toString("base64"), newKey = Buffer.alloc(32, 2).toString("base64");
test("round trip", () => {
  for (const text of ["tok", "", "Bí mật ☀️"]) assert.equal(decryptSecret(encryptSecret(text, oldKey), oldKey), text);
});
test("IV ngẫu nhiên", () => assert.notEqual(encryptSecret("tok", oldKey), encryptSecret("tok", oldKey)));
test("giả mạo bị từ chối", () => {
  const value = encryptSecret("tok", oldKey).split(".");
  const bytes = Buffer.from(value[3], "base64url"); bytes[0] ^= 1; value[3] = bytes.toString("base64url");
  assert.throws(() => decryptSecret(value.join("."), oldKey), /Bí mật không hợp lệ/);
});
test("xoay khóa", () => {
  const value = encryptSecret("tok", oldKey), ring = `${newKey},${oldKey}`;
  assert.equal(decryptSecret(value, ring), "tok"); assert.ok(needsRotation(value, ring));
  const next = encryptSecret(decryptSecret(value, ring), ring);
  assert.equal(decryptSecret(next, newKey), "tok"); assert.equal(needsRotation(next, ring), false);
});
test("khóa sai định dạng", () => {
  for (const key of ["", "abc", Buffer.alloc(31).toString("base64"), `${oldKey},${oldKey}`, `${oldKey},`, oldKey.replace(/=$/, "")])
    assert.throws(() => encryptSecret("tok", key), /APP_ENCRYPTION_KEY/);
});
test("kid lạ", () => assert.throws(() => decryptSecret(encryptSecret("tok", oldKey), newKey), /khóa không còn/));
test("lỗi không lộ bí mật", () => {
  const value = encryptSecret("sentinel-plaintext", oldKey);
  for (const input of [value, "test", "v1.bad.bad.bad"]) {
    assert.throws(() => decryptSecret(input, newKey), (error: Error) => {
      for (const secret of [value, oldKey, newKey, "sentinel-plaintext"]) assert.ok(!error.message.includes(secret));
      return true;
    });
  }
});
