import { requirePagePermission } from "../../../../lib/auth.ts";
import { ActionForm } from "../../../../components/ActionForm.tsx";
import { Field } from "../../../../components/Fields.tsx";
import { beginTotpAction, enableTotpAction, disableTotpAction } from "../../../actions.ts";

export default async function Security() {
  await requirePagePermission("account.totp");
  return <section className="space-y-8"><h1>Xác thực hai bước</h1><p>Bảo vệ tài khoản bằng mã từ ứng dụng xác thực. Khuyến nghị chủ site và quản trị viên bật tính năng này.</p>
    <section className="space-y-4"><h2>1. Lấy khóa thiết lập</h2><ActionForm action={beginTotpAction} label="Bắt đầu thiết lập" permalink="/tai-khoan/bao-mat" /></section>
    <section className="space-y-4"><h2>2. Xác nhận bật</h2><ActionForm action={enableTotpAction} label="Bật xác thực hai bước" permalink="/tai-khoan/bao-mat"><Field label="Mã xác thực 6 số" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></ActionForm></section>
    <section className="space-y-4"><h2>Tắt xác thực hai bước</h2><ActionForm action={disableTotpAction} label="Tắt xác thực hai bước" permalink="/tai-khoan/bao-mat"><Field label="Mã xác thực hoặc mã dự phòng" name="code" autoComplete="one-time-code" maxLength={20} required /></ActionForm></section>
  </section>;
}
