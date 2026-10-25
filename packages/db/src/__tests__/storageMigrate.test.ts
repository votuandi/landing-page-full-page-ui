import assert from "node:assert/strict";
import test from "node:test";
import type { StorageDriver } from "@solar/storage";
import { copyMediaObjects, migrationInput } from "../storageMigrate.ts";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

test("checksum mismatch and missing source stop migration; foreign keys ignored", async () => {
  const row = { tenantId: "tenant", key: "private/tenant/a.png", mime: "image/png", variants: [{ key: "tenants/foreign/x.webp", width: 640, height: 480, size: 1, format: "webp" }] };
  const puts: string[] = [];
  const source = { get: async () => Buffer.from("source") } as unknown as StorageDriver;
  const target = { put: async (key: string) => { puts.push(key); }, get: async () => Buffer.from("wrong") } as unknown as StorageDriver;
  await assert.rejects(copyMediaObjects(row, source, target), /checksum/i);
  assert.deepEqual(puts, [row.key]);
  await assert.rejects(copyMediaObjects(row, { ...source, get: async () => null }, target), /thiếu|Không tìm thấy/i);
  assert.throws(() => migrationInput({ tenant: "a", from: "local", to: "local" }), /khác/i);
  for (const raw of [{ tenant: "", from: "local", to: "s3" }, { tenant: "a", from: "bad", to: "s3" }]) assert.throws(() => migrationInput(raw));
});

test("migration CLI rejects same driver and missing target env before connecting or writing", () => {
  const script = fileURLToPath(new URL("../../scripts/storage-migrate.ts", import.meta.url));
  for (const [to, expected] of [["local", /khác/], ["s3", /S3_BUCKET/]] as const) {
    const result = spawnSync(process.execPath, ["--import", "tsx", script, "--tenant", "missing", "--from", "local", "--to", to], { encoding: "utf8", timeout: 10_000,
      env: { ...process.env, PLATFORM_DATABASE_URL: "invalid", STORAGE_LOCAL_ROOT: ".media", MEDIA_PUBLIC_BASE: "https://media.example", S3_BUCKET: "" } });
    assert.equal(result.status, 1, result.stderr); assert.match(result.stderr, expected);
  }
});

test("migration CLI unknown tenant exits 1", { skip: !process.env.PLATFORM_DATABASE_URL }, () => {
  const script = fileURLToPath(new URL("../../scripts/storage-migrate.ts", import.meta.url));
  const result = spawnSync(process.execPath, ["--import", "tsx", script, "--tenant", randomUUID(), "--from", "local", "--to", "s3"], { encoding: "utf8", timeout: 10_000,
    env: { ...process.env, STORAGE_LOCAL_ROOT: ".media", MEDIA_PUBLIC_BASE: "https://media.example", S3_BUCKET: "test" } });
  assert.equal(result.status, 1, result.stderr); assert.match(result.stderr, /Không tìm thấy tenant/);
});
