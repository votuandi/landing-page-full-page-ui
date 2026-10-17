import { requirePagePermission } from "../../../lib/auth.ts";
import { ActionForm } from "../../../components/ActionForm.tsx";
import { Field, NewPasswordFields } from "../../../components/Fields.tsx";
import { changePasswordAction, logoutAction } from "../../actions.ts";

export default async function ChangePassword() {
  const session = await requirePagePermission("account.password");
  return <div className="mx-auto max-w-md space-y-6"><h1>Đổi mật khẩu</h1>
    {session.mustChangePassword && <p>Bạn cần đổi mật khẩu tạm trước khi tiếp tục quản trị website.</p>}
    <ActionForm action={changePasswordAction} label="Lưu mật khẩu mới" permalink="/doi-mat-khau">
      {!session.mustChangePassword && <Field label="Mật khẩu hiện tại" name="current" type="password" autoComplete="current-password" maxLength={1024} required />}
      <NewPasswordFields />
    </ActionForm>
    <ActionForm action={logoutAction} label="Đăng xuất" permalink="/doi-mat-khau" />
  </div>;
}
