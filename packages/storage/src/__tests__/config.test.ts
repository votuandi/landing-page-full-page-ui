import assert from "node:assert/strict";
import test from "node:test";
import { storageFor, defaultDriver } from "../config.ts";

test("storageFor per driver validates only selected configuration and prefers its public base", () => {
  const env = { STORAGE_DRIVER: "local", STORAGE_LOCAL_ROOT: ".media", MEDIA_PUBLIC_BASE: "https://fallback.example", MEDIA_PUBLIC_BASE_S3: "https://s3.example", S3_BUCKET: "test", S3_REGION: "auto" };
  assert.equal(storageFor("s3", env).publicUrl("tenants/a/x"), "https://s3.example/tenants/a/x");
  assert.equal(storageFor("local", { ...env, S3_ENDPOINT: "invalid", MEDIA_PUBLIC_BASE_LOCAL: "https://local.example" }).publicUrl("tenants/a/x"), "https://local.example/tenants/a/x");
  assert.equal(defaultDriver({}), "local");
  assert.equal(defaultDriver({ STORAGE_DRIVER: "s3" }), "s3");
  assert.throws(() => defaultDriver({ STORAGE_DRIVER: "invalid" }), /STORAGE_DRIVER/);
  assert.throws(() => storageFor("s3", { ...env, S3_BUCKET: undefined }), /S3_BUCKET/);
});

test("empty per-driver public bases fall back to MEDIA_PUBLIC_BASE", () => {
  for (const kind of ["local", "s3"] as const) {
    const env = { STORAGE_LOCAL_ROOT: ".media", S3_BUCKET: "test", MEDIA_PUBLIC_BASE: "https://fallback.example", MEDIA_PUBLIC_BASE_LOCAL: "", MEDIA_PUBLIC_BASE_S3: "" };
    assert.equal(storageFor(kind, env).publicUrl("tenants/a/x"), "https://fallback.example/tenants/a/x");
  }
});
