import { nextConfig } from "@solar/config/eslint";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const config = [
  { ignores: ["apps/**", "packages/**"] },
  ...nextConfig(dirname(fileURLToPath(import.meta.url))),
];

export default config;
