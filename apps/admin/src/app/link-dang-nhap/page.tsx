import Link from "next/link";
import { ActionForm } from "../../components/ActionForm.tsx";
import { Field } from "../../components/Fields.tsx";
import { requestMagicAction } from "../actions.ts";

export default function MagicLink() {
  return <div className="mx-auto max-w-md space-y-5"><h1>Đăng nhập bằng link qua email</h1><p>Link có hiệu lực 15 phút, dùng một lần. Tài khoản bật xác thực hai bước vẫn cần mã xác thực.</p>
    <ActionForm action={requestMagicAction} label="Gửi link đăng nhập" permalink="/link-dang-nhap"><Field label="Email, số điện thoại hoặc tên đăng nhập" name="identifier" maxLength={254} required /></ActionForm>
    <Link prefetch={false} href="/dang-nhap">Về đăng nhập</Link>
  </div>;
}
