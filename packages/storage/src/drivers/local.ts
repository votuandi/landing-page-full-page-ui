import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { assertKey, assertPublicKey, InvalidKeyError } from "../key.ts";
import type { StorageDriver } from "../types.ts";

export interface LocalDriverOptions {
  root: string;
  publicBase: string;
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === "ENOENT";

// Windows: rename đè lên đích đang bị một rename/đọc khác giữ trả EPERM/EACCES/EBUSY — thử lại ngắn như graceful-fs.
async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try { return await rename(from, to); }
    catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (attempt >= 10 || !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) throw error;
      await new Promise((done) => setTimeout(done, 10 * (attempt + 1)));
    }
  }
}

export function createLocalDriver({ root, publicBase }: LocalDriverOptions): StorageDriver {
  const directory = resolve(root);
  const base = publicBase.replace(/\/+$/, "");
  function pathFor(key: string): string {
    assertKey(key);
    const target = resolve(directory, key);
    if (!target.startsWith(`${directory.endsWith(sep) ? directory : directory + sep}`)) throw new InvalidKeyError();
    return target;
  }

  async function* walk(path: string, prefix: string): AsyncIterable<string> {
    let entries;
    try { entries = await readdir(path, { withFileTypes: true }); }
    catch (error) { if (missing(error)) return; throw error; }
    for (const entry of entries) {
      const key = prefix + entry.name;
      if (entry.isDirectory() && !entry.name.startsWith(".")) yield* walk(resolve(path, entry.name), `${key}/`);
      else if (entry.isFile()) yield key;
    }
  }

  return {
    async get(key) {
      const target = pathFor(key);
      try { return new Uint8Array(await readFile(target)); }
      catch (error) { if (missing(error)) return null; throw error; }
    },
    async put(key, body) {
      const target = pathFor(key);
      const temporaryDirectory = resolve(directory, ".tmp");
      await mkdir(dirname(target), { recursive: true });
      await mkdir(temporaryDirectory, { recursive: true });
      const temporary = resolve(temporaryDirectory, randomUUID());
      try {
        await writeFile(temporary, body, { flag: "wx" });
        await renameWithRetry(temporary, target);
      } finally { await rm(temporary, { force: true }); }
    },
    async delete(key) {
      const target = pathFor(key);
      try { await unlink(target); }
      catch (error) { if (!missing(error)) throw error; }
    },
    async *list(prefix) {
      assertKey(prefix, { prefix: true });
      for await (const key of walk(directory, "")) if (key.startsWith(prefix)) yield key;
    },
    async head(key) {
      const target = pathFor(key);
      try {
        const info = await stat(target);
        return info.isFile() ? { size: info.size } : null;
      } catch (error) { if (missing(error)) return null; throw error; }
    },
    publicUrl(key) {
      assertPublicKey(key);
      pathFor(key);
      return `${base}/${key}`;
    },
  };
}
