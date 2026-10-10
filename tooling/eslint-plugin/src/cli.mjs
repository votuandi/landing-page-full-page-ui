#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { ESLint } from "eslint";
import { tokensConfig } from "./index.mjs";
import { findHardcoded, hasExemption, isAllowlisted, messageFor } from "./matchers.mjs";

const ignored = new Set(["node_modules", ".next", "dist", ".test-dist"]);
function collect(path) {
  if (isAllowlisted(path)) return [];
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((name) => ignored.has(name) ? [] : collect(join(path, name)));
  }
  return /\.(?:[cm]?js|jsx|tsx?|css)$/.test(path) ? [path] : [];
}

try {
  const files = (process.argv.slice(2).length ? process.argv.slice(2) : ["src"]).flatMap((path) => collect(resolve(path)));
  const scripts = files.filter((file) => extname(file) !== ".css");
  const eslint = new ESLint({ allowInlineConfig: false, overrideConfigFile: true, overrideConfig: tokensConfig });
  let count = 0;
  for (const result of scripts.length ? await eslint.lintFiles(scripts) : []) {
    for (const message of result.messages) {
      console.log(`${result.filePath}:${message.line}:${message.column}  ${message.message}`);
      count++;
    }
  }
  for (const file of files.filter((file) => extname(file) === ".css")) {
    const css = readFileSync(file, "utf8");
    const comments = [...css.matchAll(/\/\*[\s\S]*?\*\//g)].filter((match) => hasExemption(match[0].slice(2, -2)));
    const exemptLines = new Set(comments.flatMap((match) => {
      const start = css.slice(0, match.index).split("\n").length;
      const end = start + match[0].split("\n").length - 1;
      return [start, end, end + 1];
    }));
    css.split(/\r?\n/).forEach((line, index) => {
      if (exemptLines.has(index + 1)) return;
      for (const match of findHardcoded(line)) {
        console.log(`${file}:${index + 1}:${match.index + 1}  ${messageFor(match)}`);
        count++;
      }
    });
  }
  console.log(`lint:tokens: ${count} vi phạm`);
  process.exitCode = count ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
