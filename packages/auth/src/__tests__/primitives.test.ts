import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import test from "node:test";
import { hashPassword, verifyPassword, checkPasswordPolicy } from "../password.ts";
import { COMMON_PASSWORDS } from "../commonPasswords.ts";
import { parseLoginId, InvalidLoginIdError } from "../loginId.ts";
import { base32Encode, base32Decode, totp, verifyTotp, generateTotpSecret, otpauthUri, generateBackupCodes, consumeBackupCode } from "../totp.ts";
import { adminUsernameFor } from "../../../core/src/tenantSlug.ts";

test("login identifiers normalize the five AC inputs and reject garbage", () => {
  for (const [input, expected] of [
    ["A@X.vn ", { kind: "email", value: "a@x.vn" }],
    ["0901 234 567", { kind: "phone", value: "0901234567" }],
    ["+84901234567", { kind: "phone", value: "0901234567" }],
    ["84901234567", { kind: "phone", value: "0901234567" }],
    ["NangLuongSolar_Admin", { kind: "username", value: "nangluongsolar_admin" }],
  ] as const) assert.deepEqual(parseLoginId(input), expected);
  for (const input of ["", "x@", "a@@x.vn", "ab", "abc!", "1234567890", "+84+901234567", "0901.234.567+", "x".repeat(255)]) {
    assert.throws(() => parseLoginId(input), InvalidLoginIdError, input);
  }
});

test("login accepts owners generated from a maximum-length tenant slug (D21 and DB allow 70)", () => {
  const value = adminUsernameFor("a".repeat(63));
  assert.equal(value.length, 69);
  assert.deepEqual(parseLoginId(value), { kind: "username", value });
  assert.deepEqual(parseLoginId("a".repeat(70)), { kind: "username", value: "a".repeat(70) });
  assert.throws(() => parseLoginId("a".repeat(71)), InvalidLoginIdError);
});

test("scrypt reads seed hashes, salts each password and safely rejects malformed hashes", async () => {
  const pw = "Solar!password-strong";
  const salt = Buffer.from("seed-compatible-salt");
  const derived = scryptSync(pw, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const seedHash = `scrypt$32768$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  assert.equal(await verifyPassword(pw, seedHash), true);
  assert.equal(await verifyPassword("wrong", seedHash), false);
  const a = await hashPassword(pw), b = await hashPassword(pw);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(pw, a), true);
  for (const bad of ["", "bad", a + "$extra", a.replace("32768", "9999999999"), a.replace("$8$1$", "$8$99$"), "scrypt$32768$8$1$!$bad"]) {
    assert.equal(await verifyPassword(pw, bad), false);
  }
});

test("password policy blocks common passwords and identifiers", () => {
  assert.ok(COMMON_PASSWORDS.size >= 1000);
  for (const pw of ["short", "x".repeat(129), "1234567890", "PASSWORD123", "matkhau123", "My_Account"]) {
    assert.equal(checkPasswordPolicy(pw, { identifiers: ["my_account"] }).ok, false, pw);
  }
  assert.deepEqual(checkPasswordPolicy("Solar!random-2026", { identifiers: [] }), { ok: true });
});

test("TOTP matches all six RFC 6238 Appendix B SHA1 vectors", () => {
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  assert.equal(base32Decode(secret).toString(), "12345678901234567890");
  for (const [seconds, expected] of [[59, "94287082"], [1111111109, "07081804"], [1111111111, "14050471"], [1234567890, "89005924"], [2000000000, "69279037"], [20000000000, "65353130"]] as const) {
    assert.equal(totp(secret, seconds * 1000, { digits: 8 }), expected);
  }
  const now = 1234567890000;
  for (const shift of [-30_000, 0, 30_000]) assert.equal(verifyTotp(secret, totp(secret, now + shift), now), true);
  assert.equal(verifyTotp(secret, totp(secret, now + 60_000), now), false);
  for (const code of ["", "12345", "1234567", "abcdef"]) assert.equal(verifyTotp(secret, code, now), false);
  assert.equal(verifyTotp("!", "123456", now), false);
  const generated = generateTotpSecret();
  assert.equal(base32Decode(generated).length, 20);
  const uri = new URL(otpauthUri({ issuer: "Điện mặt trời", account: "a@x.vn", secret: generated }));
  assert.equal(uri.searchParams.get("issuer"), "Điện mặt trời");
  assert.equal(uri.searchParams.get("secret"), generated);
});

test("backup codes contain 40 random bits, are hashed and consumed once", () => {
  const { codes, hashes } = generateBackupCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  codes.forEach(code => assert.match(code, /^[a-z2-7]{4}-[a-z2-7]{4}$/));
  hashes.forEach(hash => assert.match(hash, /^[a-f0-9]{64}$/));
  assert.equal(consumeBackupCode(hashes, "invalid"), null);
  const remaining = consumeBackupCode(hashes, codes[0].toUpperCase())!;
  assert.equal(remaining.length, 9);
  assert.equal(consumeBackupCode(remaining, codes[0]), null);
  assert.equal(hashes.length, 10);
});
