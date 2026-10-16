import { requirePagePermission } from "../../../lib/auth.ts";
export default async function Domains() {
  await requirePagePermission("domains.manage");
  return <section><h1>Tên miền</h1><p>Màn hình quản lý tên miền sẽ được bổ sung ở story tiếp theo.</p></section>;
}
