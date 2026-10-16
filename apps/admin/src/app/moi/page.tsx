import { ActionForm } from "../../components/ActionForm.tsx";
import { NewPasswordFields } from "../../components/Fields.tsx";
import { acceptInviteAction } from "../actions.ts";

export default async function Invite({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <div className="mx-auto max-w-md space-y-5"><h1>Nhận lời mời quản trị</h1><p>Đặt mật khẩu để kích hoạt tài khoản. Lời mời có hiệu lực 72 giờ và dùng một lần.</p>
    <ActionForm action={acceptInviteAction} label="Kích hoạt và đăng nhập" permalink={`/moi?token=${encodeURIComponent(token)}`}><input type="hidden" name="token" value={token} /><NewPasswordFields /></ActionForm>
  </div>;
}
