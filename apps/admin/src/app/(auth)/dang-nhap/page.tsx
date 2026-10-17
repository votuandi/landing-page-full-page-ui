import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/auth.ts";
import { ActionForm } from "../../../components/ActionForm.tsx";
import { Field } from "../../../components/Fields.tsx";
import { loginAction, loginTotpAction, magicTotpAction } from "../../actions.ts";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getAdminSession();
  if (session) redirect(session.mustChangePassword ? "/doi-mat-khau" : "/");
  const query = await searchParams, step = query.buoc;
  const challenge = step === "totp" || step === "magic-totp";
  return <div className="mx-auto max-w-md space-y-5">
    <h1>{challenge ? "Xác thực hai bước" : "Đăng nhập quản trị"}</h1>
    {query["da-dat-lai"] && <p>Đã đặt lại mật khẩu. Vui lòng đăng nhập.</p>}
    <ActionForm action={challenge ? step === "totp" ? loginTotpAction : magicTotpAction : loginAction} label={challenge ? "Xác nhận" : "Đăng nhập"} permalink={challenge ? `/dang-nhap?buoc=${step}` : "/dang-nhap"}>
      {challenge ? <Field label="Mã xác thực hoặc mã dự phòng" name="code" autoComplete="one-time-code" maxLength={20} required /> : <>
        <Field label="Email, số điện thoại hoặc tên đăng nhập" name="identifier" autoComplete="username" maxLength={254} required />
        <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password" maxLength={1024} required />
      </>}
    </ActionForm>
    <nav aria-label="Hỗ trợ đăng nhập" className="flex flex-wrap gap-4 text-sm"><Link prefetch={false} href="/quen-mat-khau">Quên mật khẩu</Link><Link prefetch={false} href="/link-dang-nhap">Đăng nhập bằng link qua email</Link>{challenge && <Link prefetch={false} href="/dang-nhap">Nhập lại tài khoản</Link>}</nav>
  </div>;
}
