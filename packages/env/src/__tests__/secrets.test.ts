import assert from "node:assert/strict";
import test from "node:test";
import { decryptSecret, encryptSecret, needsRotation } from "../secrets.ts";
const oldKey = Buffer.alloc(32, 1).toString("base64"), newKey = Buffer.alloc(32, 2).toString("base64");
const context = { tenantId: "tenant-A", integrationId: "integration-A" };
test("AAD từ chối ciphertext chép sang tenant hoặc integration khác", () => {
  const value = encryptSecret("token", oldKey, context);
  assert.equal(decryptSecret(value, oldKey, context), "token");
  for (const other of [{ ...context, tenantId: "tenant-B" }, { ...context, integrationId: "integration-B" }]) {
    assert.throws(() => decryptSecret(value, oldKey, other), /Bí mật không hợp lệ/);
    assert.throws(() => needsRotation(value, oldKey, other), /Bí mật không hợp lệ/);
  }
});
test("AAD bắt buộc có cả tenantId và integrationId", () => {
  const value = encryptSecret("token", oldKey, context);
  for (const input of [undefined, { ...context, tenantId: "" }, { ...context, integrationId: "" }]) {
    const missing = input as typeof context;
    assert.throws(() => encryptSecret("token", oldKey, missing), /ngữ cảnh/);
    assert.throws(() => decryptSecret(value, oldKey, missing), /ngữ cảnh/);
    assert.throws(() => needsRotation(value, oldKey, missing), /ngữ cảnh/);
  }
});
test("round trip", () => {
  for (const text of ["tok", "", "Bí mật ☀️"]) assert.equal(decryptSecret(encryptSecret(text, oldKey, context), oldKey, context), text);
});
test("IV ngẫu nhiên", () => assert.notEqual(encryptSecret("tok", oldKey, context), encryptSecret("tok", oldKey, context)));
test("giả mạo bị từ chối", () => {
  const value = encryptSecret("tok", oldKey, context).split(".");
  const bytes = Buffer.from(value[3], "base64url"); bytes[0] ^= 1; value[3] = bytes.toString("base64url");
  assert.throws(() => decryptSecret(value.join("."), oldKey, context), /Bí mật không hợp lệ/);
});
test("xoay khóa", () => {
  const value = encryptSecret("tok", oldKey, context), ring = `${newKey},${oldKey}`;
  assert.equal(decryptSecret(value, ring, context), "tok"); assert.ok(needsRotation(value, ring, context));
  const next = encryptSecret(decryptSecret(value, ring, context), ring, context);
  assert.equal(decryptSecret(next, newKey, context), "tok"); assert.equal(needsRotation(next, ring, context), false);
});
test("khóa sai định dạng", () => {
  for (const key of ["", "abc", Buffer.alloc(31).toString("base64"), `${oldKey},${oldKey}`, `${oldKey},`, oldKey.replace(/=$/, "")])
    assert.throws(() => encryptSecret("tok", key, context), /APP_ENCRYPTION_KEY/);
});
test("kid lạ", () => assert.throws(() => decryptSecret(encryptSecret("tok", oldKey, context), newKey, context), /khóa không còn/));
test("lỗi không lộ bí mật", () => {
  const value = encryptSecret("sentinel-plaintext", oldKey, context);
  for (const input of [value, "test", "v1.bad.bad.bad"]) {
    assert.throws(() => decryptSecret(input, newKey, context), (error: Error) => {
      for (const secret of [value, oldKey, newKey, "sentinel-plaintext"]) assert.ok(!error.message.includes(secret));
      return true;
    });
  }
});
