import { SectionHead } from "@solar/ui";
import { pickLocale, resolveLink } from "../fields";
import type { SectionPropsOf } from "../define";
import type { branchMap } from "./schema";
import BranchMap from "./t15.client";

export default function BranchMapT15({ data, site, sectionId }: SectionPropsOf<typeof branchMap>) {
  if (!data.items.length) return null;
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
      <BranchMap sectionId={sectionId} locale={site.locale} items={data.items.map((branch) => ({ ...branch,
        phoneHref: resolveLink({ kind: "phone", value: branch.hotline, label: data.hotlineLabel }).href,
        zaloHref: resolveLink({ kind: "zalo", value: branch.zaloPhone ?? branch.hotline, label: data.zaloLabel }).href,
      }))} labels={{ office: t(data.officeLabel), warehouse: t(data.warehouseLabel), hotline: t(data.hotlineLabel), directions: t(data.directionsLabel), zalo: t(data.zaloLabel) }} />
    </div>
  </section>;
}
