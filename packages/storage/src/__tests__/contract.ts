import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import type { StorageDriver } from "../types.ts";
import { InvalidKeyError } from "../key.ts";

export const badKeys = ["", "../x", "/x", "a//b", "a\\b", "a/./b", "a/../b", "a/", "a%2fb", "a?b", "a#b", "a\0b", "C:/x", "a\nb", "a\n", "a\r"];
export const collect = async (keys: AsyncIterable<string>) => {
  const result: string[] = [];
  for await (const key of keys) result.push(key);
  return result.sort();
};

export interface ContractFixture {
  driver: StorageDriver;
  read(key: string): Promise<Uint8Array>;
  cleanup(): Promise<void>;
}

export function runContract(name: string, makeDriver: () => Promise<ContractFixture>, skip?: string) {
  describe(`contract ${name}`, { skip, timeout: 60_000 }, () => {
    let fixture: ContractFixture;
    const prefix = `tenants/${randomUUID()}/`;
    const options = { contentType: "text/plain", cacheControl: "public, max-age=31536000, immutable" };
    before(async () => { fixture = await makeDriver(); });
    after(async () => {
      if (!fixture) return;
      try {
        for await (const key of fixture.driver.list(prefix)) await fixture.driver.delete(key);
      } finally { await fixture.cleanup(); }
    });

    it("put rồi head", async () => {
      const key = `${prefix}new/parents/file.txt`;
      await fixture.driver.put(key, Buffer.from("hello"), options);
      const meta = await fixture.driver.head(key);
      assert.equal(meta?.size, 5);
      if (name === "s3") assert.equal(meta?.contentType, "text/plain");
      assert.equal(Buffer.from(await fixture.read(key)).toString(), "hello");
    });
    it("ghi đè", async () => {
      const key = `${prefix}overwrite.txt`;
      await fixture.driver.put(key, Buffer.from("a"), options);
      await fixture.driver.put(key, Buffer.from("bb"), options);
      assert.equal((await fixture.driver.head(key))?.size, 2);
      assert.equal(Buffer.from(await fixture.read(key)).toString(), "bb");
    });
    it("head thiếu", async () => {
      assert.equal(await fixture.driver.head(`${prefix}missing.txt`), null);
    });
    it("get returns bytes or null", async () => {
      const key = `${prefix}read.bin`;
      assert.equal(await fixture.driver.get(key), null);
      await fixture.driver.put(key, new Uint8Array([0, 1, 255]), options);
      assert.deepEqual(await fixture.driver.get(key), new Uint8Array([0, 1, 255]));
      await fixture.driver.put(key, new Uint8Array(), options);
      assert.deepEqual(await fixture.driver.get(key), new Uint8Array());
    });
    it("delete", async () => {
      const key = `${prefix}delete.txt`;
      await fixture.driver.put(key, Buffer.from("x"), options);
      await fixture.driver.delete(key);
      assert.equal(await fixture.driver.head(key), null);
      await fixture.driver.delete(key);
    });
    it("list tiền tố", async () => {
      const keys = [`${prefix}p/a/1`, `${prefix}p/ab/2`, `${prefix}q/3`];
      for (const key of keys) await fixture.driver.put(key, Buffer.from("x"), options);
      assert.deepEqual(await collect(fixture.driver.list(`${prefix}p/a/`)), [keys[0]]);
      const found = await collect(fixture.driver.list(`${prefix}p/a`));
      assert.deepEqual(found, keys.slice(0, 2));
      assert.ok(found.every(key => !key.includes("\\")));
    });
    it("list nhiều trang", async () => {
      const keys = [1, 2, 3, 4, 5].map(i => `${prefix}pages/${i}`);
      for (const key of keys) await fixture.driver.put(key, Buffer.from("x"), options);
      assert.deepEqual(await collect(fixture.driver.list(`${prefix}pages/`)), keys);
    });
    it("publicUrl", () => {
      assert.equal(fixture.driver.publicUrl("tenants/t/k.jpg"), "https://cdn.example.com/m/tenants/t/k.jpg");
    });
    it("khóa xấu", async () => {
      for (const key of badKeys) {
        await assert.rejects(async () => fixture.driver.put(key, Buffer.from("x"), options), InvalidKeyError, key);
        await assert.rejects(async () => fixture.driver.delete(key), InvalidKeyError, key);
        await assert.rejects(async () => fixture.driver.head(key), InvalidKeyError, key);
        await assert.rejects(async () => fixture.driver.get(key), InvalidKeyError, key);
        assert.throws(() => fixture.driver.publicUrl(key), InvalidKeyError, key);
        // Empty and trailing-slash prefixes are explicitly valid for list.
        if (key !== "" && key !== "a/") {
          await assert.rejects(() => collect(fixture.driver.list(key)), InvalidKeyError, key);
        }
      }
    });
    it("put đồng thời", async () => {
      const key = `${prefix}concurrent.bin`;
      const a = Buffer.alloc(64 * 1024, 65), b = Buffer.alloc(32 * 1024, 66);
      await Promise.all([fixture.driver.put(key, a, options), fixture.driver.put(key, b, options)]);
      const result = Buffer.from(await fixture.read(key));
      assert.ok(result.equals(a) || result.equals(b), "final object must be one complete body");
    });
    it("list rỗng", async () => {
      assert.deepEqual(await collect(fixture.driver.list(`${prefix}absent/`)), []);
    });
    it("file rỗng", async () => {
      const key = `${prefix}empty.txt`;
      await fixture.driver.put(key, new Uint8Array(), options);
      assert.equal((await fixture.driver.head(key))?.size, 0);
    });
  });
}
