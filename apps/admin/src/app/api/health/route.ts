import { checkConnection } from "@solar/db";
import { healthResponse } from "../../../lib/health.ts";
import { getRuntime } from "../../../lib/runtime.ts";

export const dynamic = "force-dynamic";

export function GET() {
  return healthResponse({
    db: () => checkConnection(getRuntime().db, { fresh: true }),
    redis: process.env.REDIS_URL ? () => getRuntime().redis!.ping() : undefined,
  });
}
