import { randomUUID } from "node:crypto";
import { mkdir, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { assertKey, InvalidKeyError } from "../key.ts";
import type { StorageDriver } from "../types.ts";

export interface LocalDriverOptions {
  root: string;
  publicBase: string;
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === "ENOENT";

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
    async put(key, body) {
      const target = pathFor(key);
      const temporaryDirectory = resolve(directory, ".tmp");
      await mkdir(dirname(target), { recursive: true });
      await mkdir(temporaryDirectory, { recursive: true });
      const temporary = resolve(temporaryDirectory, randomUUID());
      try {
        await writeFile(temporary, body, { flag: "wx" });
        await rename(temporary, target);
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
      pathFor(key);
      return `${base}/${key}`;
    },
  };
}
