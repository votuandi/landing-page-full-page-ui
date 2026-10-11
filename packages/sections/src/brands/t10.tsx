import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { T10Head, T10_UI } from "../shared/t10";
import type { brands } from "./schema";
import ClientWall from "./t10.client";

/** Brands t10 (ClientWall): lọc theo nhóm, băng logo chạy ngang có nút tạm dừng. */
export default function BrandsT10({ data, site, sectionId }: SectionPropsOf<typeof brands>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="py-16">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} className="mb-7" />
        <ClientWall ui={T10_UI[site.locale]} title={t(data.title)}
          groups={data.groups.map((group) => ({ id: group.id, label: t(group.label) }))}
          items={data.items.map((item) => ({ name: t(item.name), group: item.group, groupLabel: t(data.groups.find((group) => group.id === item.group)!.label), logo: mediaSrc(item.logo) }))} />
      </div>
    </section>
  );
}
