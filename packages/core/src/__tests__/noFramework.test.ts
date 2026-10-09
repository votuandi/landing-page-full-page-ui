import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import * as core from "../index";

const packageRoot = resolve(__dirname, "../..");
const isFramework = (name: string) => /^(react|react-dom|next)(\/|$)/.test(name);

test("core: không có dependency runtime hoặc import React/Next trong source", () => {
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const name of Object.keys(manifest[field] ?? {})) assert.equal(isFramework(name), false, name);
  }

  const scan = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (entry.name.endsWith(".ts")) {
        const source = readFileSync(path, "utf8");
        for (const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)["']([^"']+)["']/g)) {
          assert.equal(isFramework(match[1]), false, `${path}: ${match[1]}`);
        }
      }
    }
  };
  scan(resolve(packageRoot, "src"));
});

test("core: barrel dùng trong Node mà không cần window/document", () => {
  assert.equal(typeof core.calculateSolar, "function");
  assert.equal(typeof core.openCalculator, "function");
  assert.equal(core.formatVnd(1000), "1.000 ₫");
  assert.equal(core.segmentFromParam("cua-hang"), "shop");
});
