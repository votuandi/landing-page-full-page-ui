import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { ActionForm } from "../../../../components/ActionForm.tsx";
import { Field } from "../../../../components/Fields.tsx";
import { beginTotpAction, enableTotpAction, disableTotpAction } from "../../../actions.ts";
import { getRuntime } from "../../../../lib/runtime.ts";
import { createStaff } from "../../../../lib/staff.ts";
import { deviceLabel, staffDate } from "../../../../lib/staffLabels.ts";
import { logoutOtherSessions } from "./actions.ts";

export default async function Security() {
  const session = await requirePagePermission("account.totp");
  const sessions = await createStaff(getRuntime()).sessions(session, (await getTenant()).tenantId);
  return <section className="space-y-8"><h1>Bảo mật tài khoản</h1><p>Bảo vệ tài khoản bằng mã từ ứng dụng xác thực. Khuyến nghị chủ site và quản trị viên bật tính năng này.</p>
    <section className="space-y-4"><h2>1. Lấy khóa thiết lập</h2><ActionForm action={beginTotpAction} label="Bắt đầu thiết lập" permalink="/tai-khoan/bao-mat" /></section>
    <section className="space-y-4"><h2>2. Xác nhận bật</h2><ActionForm action={enableTotpAction} label="Bật xác thực hai bước" permalink="/tai-khoan/bao-mat"><Field label="Mã xác thực 6 số" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></ActionForm></section>
    <section className="space-y-4"><h2>Tắt xác thực hai bước</h2><ActionForm action={disableTotpAction} label="Tắt xác thực hai bước" permalink="/tai-khoan/bao-mat"><Field label="Mã xác thực hoặc mã dự phòng" name="code" autoComplete="one-time-code" maxLength={20} required /></ActionForm></section>
    <section className="space-y-4"><h2>Thiết bị đang đăng nhập</h2>
      <p className="text-sm text-fg-muted">Đăng xuất thiết bị khác sẽ kết thúc cả phiên quản trị và phiên khách hàng của bạn trên thiết bị đó.</p>
      <ul className="space-y-3">{sessions.map(row => <li key={row.id} className="min-w-0 space-y-1 break-words rounded-card border border-line/20 bg-bg-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="min-w-0 font-medium">{deviceLabel(row.userAgent)}</p>{row.current && <span className="shrink-0 rounded-pill bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Thiết bị này</span>}</div>
        <p className="text-sm text-fg-muted">{row.audience === "admin" ? "Quản trị" : "Khách hàng"} · IP: {row.ip ?? "Không rõ"}</p>
        <p className="text-sm tabular-nums">Hoạt động gần nhất: {staffDate(row.lastSeenAt)}</p>
      </li>)}</ul>
      <ActionForm action={logoutOtherSessions} label="Đăng xuất các thiết bị khác" permalink="/tai-khoan/bao-mat" secondary />
    </section>
  </section>;
}
