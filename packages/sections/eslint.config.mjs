import { nextConfig } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const config = [
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web")),
  { settings: { react: { version: "19.0" } } },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        message: "Rich text phải render qua whitelist React element.",
      }],
      "react/no-danger": "error",
    },
  },
];

export default config;
