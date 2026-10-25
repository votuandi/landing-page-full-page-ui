import baseConfig, { nextConfig } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default [
  // Plain Node process: reuse the shared TS rules without Next's Babel parser.
  ...baseConfig.map(config => config.files ? { ...config, files: ["**/*.mjs", "**/*.js"] } : config),
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web"))
    .map((config) => "ignores" in config && !config.files ? config : { ...config, files: ["**/*.ts"] }),
  { files: ["**/*.mjs", "**/*.js"], languageOptions: { globals: { process: "readonly", console: "readonly", Buffer: "readonly", setTimeout: "readonly", clearTimeout: "readonly" } } },
  { settings: { react: { version: "19.0" } } },
];
