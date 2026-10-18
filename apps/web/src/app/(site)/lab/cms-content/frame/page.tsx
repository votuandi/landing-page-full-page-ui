import { PageRenderer, pageConfigSchema, sectionRegistry } from "@solar/sections";

const page = pageConfigSchema.parse({ sections: [
  { id: "hero", type: "hero", variant: "t12", enabled: true, data: sectionRegistry.types.hero.defaults },
] });

export default function ContentFrameLab() {
  return <main>
    <p className="px-4 py-2 text-sm text-fg-muted">[DỮ LIỆU MẪU] Xem trước nội dung section</p>
    <PageRenderer page={page} site={{ tenantId: "cms-content-lab", locale: "vi", themeId: "t15" }} />
  </main>;
}
