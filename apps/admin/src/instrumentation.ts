import { adminEnv, loadEnv, type EnvOptions } from "@solar/env";

// Next inlines only the literal `process.env.NEXT_RUNTIME` at build time; read through a variable it is undefined in standalone.
export function register(env: Record<string, string | undefined> = process.env, options?: EnvOptions) {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") loadEnv(adminEnv, env, options);
}
