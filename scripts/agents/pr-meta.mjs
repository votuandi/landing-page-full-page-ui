#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function validatePrTitle(title) {
  return typeof title === "string" && /\[E\d+-S\d+\]/.test(title);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (validatePrTitle(process.env.PR_TITLE)) {
    console.log("PR title PASS: có story ID.");
  } else {
    console.error("PR title FAIL: thêm story ID dạng [E0-S05] vào tiêu đề PR.");
    process.exitCode = 1;
  }
}
