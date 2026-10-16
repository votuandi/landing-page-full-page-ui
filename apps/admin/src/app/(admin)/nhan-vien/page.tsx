import { requirePagePermission } from "../../../lib/auth.ts";
export default async function Users() {
  await requirePagePermission("users.view");
  return <section><h1>Tài khoản & nhân viên</h1><p>Màn hình quản lý nhân viên sẽ được bổ sung ở story tiếp theo.</p></section>;
}
