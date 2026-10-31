import { getTenant, requirePageFeature, requirePagePermission } from "../../../../lib/auth.ts";
import { senderDomainDeps } from "../../../../lib/senderDomainRuntime.ts";
import { senderDnsRecordsSchema } from "@solar/leads";
import { SenderDomain } from "../../../../components/SenderDomain.tsx";

export default async function SenderDomainPage() {
  await requirePagePermission("email.manage");
  await requirePageFeature("senderDomain");
  const { tenantId } = await getTenant();
  const row = await senderDomainDeps.get(tenantId);
  const parsed = senderDnsRecordsSchema.safeParse(row?.records ?? []);
  return <div className="min-w-0 space-y-6">
    <div><h1 className="text-2xl font-semibold text-fg">Tên miền gửi email</h1>
      <p className="mt-2 max-w-prose text-fg-muted">Gửi thông báo lead từ tên miền công ty. Thêm tên miền, sao chép bản ghi vào DNS rồi kiểm tra xác minh.</p></div>
    <SenderDomain domain={row ? { hostname: row.hostname, status: row.status, records: parsed.success ? parsed.data : [], initialized: !!row.providerId } : null} />
  </div>;
}
