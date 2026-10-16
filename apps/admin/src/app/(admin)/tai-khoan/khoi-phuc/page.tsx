import Link from "next/link";
import { requirePagePermission } from "../../../../lib/auth.ts";
export default async function Recovery() {
  await requirePagePermission("account.password");
  return <section className="space-y-4"><h1>Bảo vệ quyền truy cập</h1><p>Hãy thêm email và số điện thoại để có thể khôi phục tài khoản khi cần. Liên hệ chủ site hoặc hỗ trợ để cập nhật thông tin và xác minh email.</p><p><Link prefetch={false} href="/">Bỏ qua và tới tổng quan</Link></p></section>;
}
