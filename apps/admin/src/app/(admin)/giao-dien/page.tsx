import { requirePagePermission } from "../../../lib/auth.ts";

export default async function Appearance() {
  await requirePagePermission("theme.manage");
  return <section><h1>Giao diện</h1><p>Màn hình này sẽ có ở story E7-S08.</p></section>;
}
