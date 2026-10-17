import { requirePageFeature, requirePagePermission } from "../../../lib/auth.ts";

export default async function Leads() {
  await requirePagePermission("leads.view");
  await requirePageFeature("leadInbox");
  return <section><h1>Lead</h1><p>Màn hình này sẽ có ở epic E11.</p></section>;
}
