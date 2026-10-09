import { nextConfig } from "@solar/config/eslint";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export default nextConfig(dirname(fileURLToPath(import.meta.url)));
