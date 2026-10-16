import { createRevalidateHandler } from "../../../lib/tenant/revalidate";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createRevalidateHandler();
