import { requirePagePermission } from "../../../lib/auth.ts";

export default async function Media() {
  await requirePagePermission("media.view");
  return <section><h1>Media</h1><p>Màn hình này sẽ có ở epic E8.</p></section>;
}
