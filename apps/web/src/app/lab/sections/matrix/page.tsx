import { sectionRegistry } from "@solar/sections";
import { themes } from "@solar/themes";

export default function MatrixIndexPage() {
  return <main className="mx-auto max-w-container px-4 py-8 text-fg">
    <h1 className="text-3xl font-bold">Ma trận section</h1>
    <p className="mt-3 text-fg-muted">[DỮ LIỆU MẪU] · {themes.length} theme hiện có. Mục tiêu ≥ 4 theme đạt sau E4.</p>
    <p className="mt-2">Theme: {themes.map((theme) => theme.meta.id).join(", ")}</p>
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.keys(sectionRegistry.types).map((type) => <li key={type} className="rounded-card border border-border bg-bg-elevated p-4">
        <a href={`/lab/sections/${type}`} data-lab-type={type} className="text-primary underline">{type}</a>
        <p className="mt-2 text-sm text-fg-muted">Variant: {sectionRegistry.variantsOf(type)?.join(", ")}</p>
      </li>)}
    </ul>
  </main>;
}
