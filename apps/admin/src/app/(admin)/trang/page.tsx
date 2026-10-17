import { requirePagePermission } from "../../../lib/auth.ts";

export default async function Pages() {
  await requirePagePermission("pages.view");
  return <section><h1>Trang &amp; Section</h1><p>Màn hình này sẽ có ở story E7-S04/E7-S05.</p></section>;
}
