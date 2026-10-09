import { nextConfig } from "@solar/config/eslint";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const config = [
  { ignores: ["apps/**", "packages/**", "tooling/**"] },
  ...nextConfig(join(dirname(fileURLToPath(import.meta.url)), "apps/web")),
];

export default config;
