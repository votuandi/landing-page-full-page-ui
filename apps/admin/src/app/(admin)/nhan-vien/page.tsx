import { getTenant, requirePagePermission } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { createStaff } from "../../../lib/staff.ts";
import { StaffManager } from "../../../components/StaffManager.tsx";
export default async function Users() {
  const session = await requirePagePermission("users.view");
  const data = await createStaff(getRuntime()).list(session, (await getTenant()).tenantId);
  return <section className="space-y-6"><h1>Tài khoản & nhân viên</h1>
    <p className="text-fg-muted">Quản lý người được vào CMS của site. Chỉ chủ sở hữu có thể chuyển quyền sở hữu và chuyển đổi tài khoản khách hàng.</p>
    <StaffManager data={data} access={{ accountId: session.accountId, role: session.role, kind: session.kind, permissions: [...session.permissions] }} />
  </section>;
}
