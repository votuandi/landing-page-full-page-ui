import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = dirname(fileURLToPath(import.meta.url));

export const ignores = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.test-dist/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/build/**",
  "**/dist/**",
  "**/out/**",
  "**/.*/*",
];

/** @param {string} appDirectory */
export function nextConfig(appDirectory) {
  const compat = new FlatCompat({
    baseDirectory: configDirectory,
    resolvePluginsRelativeTo: configDirectory,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
  });
  return [
    { ignores },
    { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"] },
    ...compat.extends("next/core-web-vitals"),
    { settings: { next: { rootDir: appDirectory } } },
  ];
}

export default [
  { ignores },
  { ...js.configs.recommended, files: ["**/*.mjs"] },
];
