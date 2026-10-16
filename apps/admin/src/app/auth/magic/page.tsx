import { ActionForm } from "../../../components/ActionForm.tsx";
import { magicLoginAction } from "../../actions.ts";

export default async function RedeemMagic({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <div className="mx-auto max-w-md space-y-5"><h1>Xác nhận đăng nhập</h1><p>Bấm tiếp tục để dùng link đăng nhập này.</p>
    <ActionForm action={magicLoginAction} label="Tiếp tục đăng nhập" permalink={`/auth/magic?token=${encodeURIComponent(token)}`}><input type="hidden" name="token" value={token} /></ActionForm>
  </div>;
}
