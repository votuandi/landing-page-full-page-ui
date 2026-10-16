import { requirePagePermission } from "../../../lib/auth.ts";
export default async function Billing() {
  await requirePagePermission("billing.view");
  return <section><h1>Gói dịch vụ</h1><p>Màn hình quản lý gói sẽ được bổ sung ở story tiếp theo.</p></section>;
}
