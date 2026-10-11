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

export const prismaBoundary = {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@prisma/*", "pg", "pg/*", "**/generated/**", "@solar/db/generated*"],
        message: "Dùng forTenant/forPlatform từ @solar/db",
      }],
    }],
    "no-restricted-syntax": ["error", ...[
      "CallExpression[callee.name='require'] > Literal.arguments",
      "ImportExpression > Literal.source",
    ].map((node) => ({
      selector: `${node}[value=/^(@prisma\\/|pg($|\\/)|@solar\\/db\\/generated|.*\\/generated\\/)/]`,
      message: "Dùng forTenant/forPlatform từ @solar/db",
    }))],
  },
};

/** @param {string} appDirectory */
export function nextConfig(appDirectory) {
  return [
    { ignores },
    { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"] },
    ...nextVitals,
    prismaBoundary,
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
  prismaBoundary,
];
