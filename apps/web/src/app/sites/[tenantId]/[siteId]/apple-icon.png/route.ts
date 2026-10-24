import { tenantIcon } from "@/lib/tenant/iconRuntime";

export async function GET(_request: Request, { params }: { params: Promise<{ tenantId: string; siteId: string }> }) {
  const { tenantId, siteId } = await params;
  return tenantIcon(tenantId, siteId, 180);
}
