import type { SectionPropsOf } from "@solar/sections";
import type { demo } from "./schema";
import Island from "./v2.client";

export default function DemoVariant({ data, site, sectionId }: SectionPropsOf<typeof demo>) {
  return (
    <section id={sectionId} className="space-y-4 rounded-card border border-border bg-bg-elevated p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-fg">{data.title[site.locale] ?? data.title.vi} · v2</h2>
      <Island />
    </section>
  );
}
