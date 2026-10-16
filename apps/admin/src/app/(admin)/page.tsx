import { requirePagePermission } from "../../lib/auth.ts";
export default async function Dashboard() {
  await requirePagePermission("dashboard.view");
  return <section><h1>Tổng quan</h1><p>Bạn đã đăng nhập vào trang quản trị của site.</p></section>;
}
