import { adminEnv, loadEnv, type EnvOptions } from "@solar/env";

export function register(env: Record<string, string | undefined> = process.env, options?: EnvOptions) {
  if (env.NEXT_RUNTIME === "nodejs" && env.NEXT_PHASE !== "phase-production-build") loadEnv(adminEnv, env, options);
}
