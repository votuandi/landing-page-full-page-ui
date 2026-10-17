import { requirePageFeature, requirePagePermission } from "../../../lib/auth.ts";

export default async function DomainEmail() {
  await requirePagePermission("email.manage");
  await requirePageFeature("customDomain");
  return <section><h1>Email theo tên miền</h1><p>Màn hình này sẽ có ở epic E13.</p></section>;
}
