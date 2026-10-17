import Link from "next/link";
import { ActionForm } from "../../../components/ActionForm.tsx";
import { NewPasswordFields } from "../../../components/Fields.tsx";
import { resetPasswordAction } from "../../actions.ts";

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <div className="mx-auto max-w-md space-y-5"><h1>Đặt lại mật khẩu</h1>
    <ActionForm action={resetPasswordAction} label="Đặt lại mật khẩu" permalink={`/dat-lai-mat-khau?token=${encodeURIComponent(token)}`}><input type="hidden" name="token" value={token} /><NewPasswordFields /></ActionForm>
    <Link prefetch={false} href="/quen-mat-khau">Yêu cầu link mới</Link>
  </div>;
}
