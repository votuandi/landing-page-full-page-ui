import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";

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
  return [
    { ignores },
    { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"] },
    ...nextVitals,
    { settings: { next: { rootDir: appDirectory } } },
    // Luật React Compiler mới của react-hooks v7 (đi kèm eslint-config-next 16): code hiện có còn vi phạm,
    // để ở mức warn tới khi sửa riêng — xem D2 trong roadmap/02-decisions.md.
    {
      rules: {
        "react-hooks/refs": "warn",
        "react-hooks/set-state-in-effect": "warn",
        "react-hooks/immutability": "warn",
      },
    },
  ];
}

export default [
  { ignores },
  { ...js.configs.recommended, files: ["**/*.mjs"] },
];
