import { PageRenderer, sectionRegistry, type PageRendererProps } from "@solar/sections";
import type { AbTest } from "@solar/db";
import { abScript, withAbVariant } from "@/lib/tenant/abTest";

export async function AbTestContent({ abTest, ...props }: PageRendererProps & { abTest: AbTest | null }) {
  const sections = props.page.sections, index = sections.findIndex(section => section.type === "hero" && section.enabled);
  if (!abTest || index < 0 || (abTest.status === "ended" && abTest.winner === "A")) return PageRenderer(props);
  const hero = sections[index], data = sectionRegistry.types.hero.schema.parse(hero.data);
  const b = { ...hero, data: withAbVariant(data, abTest) };
  if (abTest.status === "ended") return PageRenderer({ ...props, page: { sections: sections.map((section, i) => i === index ? b : section) } });
  // Keep A's anchors intact; B's section id also namespaces ids used inside the variant.
  const { anchor: _anchor, ...withoutAnchor } = b;
  const render = (items: typeof sections) => PageRenderer({ ...props, page: { sections: items } });
  const [before, a, variantB, after] = await Promise.all([
    render(sections.slice(0, index)), render([hero]), render([{ ...withoutAnchor, id: `${hero.id}-b` }]), render(sections.slice(index + 1)),
  ]);
  return <>
    <style>{'[data-ab-variant]{display:contents}html:not([data-ab="B"]) [data-ab-variant="B"],html[data-ab="B"] [data-ab-variant="A"]{display:none}'}</style>
    <script dangerouslySetInnerHTML={{ __html: abScript(abTest.id) }} />
    {before}<div data-ab-variant="A">{a}</div><div data-ab-variant="B">{variantB}</div>{after}
  </>;
}
