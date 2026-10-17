import { requirePagePermission } from "../../../lib/auth.ts";

export default async function Content() {
  await requirePagePermission("content.edit");
  return <section><h1>Nội dung</h1><p>Màn hình này sẽ có ở story E7-S06.</p></section>;
}
