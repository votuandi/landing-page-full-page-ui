import type { ComponentProps } from "react";

export function Field({ label, ...props }: ComponentProps<"input"> & { label: string; name: string }) {
  return <label className="block space-y-2"><span className="block font-medium">{label}</span><input {...props} className="block w-full rounded-input border border-line/15 bg-bg-elevated px-3 py-3 text-fg" /></label>;
}
export function NewPasswordFields() {
  return <>
    <p className="text-sm text-fg-muted">Dùng 10–128 ký tự. Tránh mật khẩu phổ biến và thông tin đăng nhập của bạn.</p>
    <Field label="Mật khẩu mới" name="next" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
    <Field label="Nhập lại mật khẩu mới" name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
  </>;
}
