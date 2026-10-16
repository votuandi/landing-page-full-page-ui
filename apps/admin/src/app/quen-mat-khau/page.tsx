import Link from "next/link";
import { ActionForm } from "../../components/ActionForm.tsx";
import { Field } from "../../components/Fields.tsx";
import { forgotPasswordAction } from "../actions.ts";

export default function ForgotPassword() {
  return <div className="mx-auto max-w-md space-y-5"><h1>Quên mật khẩu</h1><p>Nhập thông tin tài khoản để nhận link qua email đã xác minh. Nếu chỉ dùng số điện thoại, liên hệ chủ site, quản trị viên hoặc hỗ trợ.</p>
    <ActionForm action={forgotPasswordAction} label="Gửi link đặt lại" permalink="/quen-mat-khau"><Field label="Email, số điện thoại hoặc tên đăng nhập" name="identifier" maxLength={254} required /></ActionForm>
    <Link prefetch={false} href="/dang-nhap">Về đăng nhập</Link>
  </div>;
}
