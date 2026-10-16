import type { SectionPropsOf } from "@solar/sections";
import type { demo } from "./schema";
import Crash from "./v1.crash";

// SSR bình thường; island ném lỗi khi hydrate để kiểm error boundary của PageRenderer.
export default function CrashVariant({ data, site }: SectionPropsOf<typeof demo>) {
  return (
    <section className="rounded-card border border-border bg-bg-elevated p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-fg">{data.title[site.locale] ?? data.title.vi}</h2>
      <Crash />
    </section>
  );
}
