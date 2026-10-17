import type { SiteContext } from "@solar/sections";
import { demoRegistry } from "./_demo/registry";

const site: SiteContext = { tenantId: "lab-demo", locale: "vi", themeId: "t15" };

export default async function SectionsLabPage() {
  const sections = await Promise.all([
    { type: "demo-a", variant: "v1", id: "demo-a-v1" },
    { type: "demo-b", variant: "v1", id: "demo-b-v1" },
    { type: "demo-b", variant: "khong-co", id: "demo-b-fallback" },
  ].map(async ({ type, variant, id }) => {
    const resolved = demoRegistry.getVariant(type, variant);
    const def = demoRegistry.getType(type);
    if (!resolved || !def) return null;
    const { default: Variant } = await resolved.load();
    return <div key={id} id={id}><Variant sectionId={id} site={site} data={def.schema.parse(def.defaults)} /></div>;
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-bold text-fg">[DỮ LIỆU MẪU] Lab section registry</h1>
      <p className="text-fg-muted">Mỗi type dùng variant v1. Section cuối yêu cầu variant không tồn tại và fallback về v1.</p>
      {sections}
    </main>
  );
}
