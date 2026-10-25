import { connection } from "next/server";
import { checkConnection } from "@solar/db";
import { healthResponse } from "../../../lib/health";
import { getWebDb } from "../../../lib/tenant/db";
import { getRateLimitRedis } from "../../../lib/tenant/rateLimit";

export async function GET() {
  await connection();
  return healthResponse({
    db: () => checkConnection(getWebDb(), { fresh: true }),
    redis: process.env.REDIS_URL ? () => getRateLimitRedis()!.ping() : undefined,
  });
}
