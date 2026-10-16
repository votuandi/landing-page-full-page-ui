import { randomUUID } from "node:crypto";
import { createPlatformDb, forTenant, createPreviewToken, saveDraft } from "@solar/db";
import { signRevalidate, tenantTag } from "@solar/cache";
import { sectionRegistry } from "@solar/sections";

const slugs = ["preview-e5-t15", "preview-e5-t12"];
const port = process.env.TENANT_PUBLIC_PORT ?? "3212";
async function main() {
  const db = createPlatformDb({ pool: 2 });
  try {
    const action = process.argv[2];
    if (action === "setup" || action === "cleanup") {
      const old = await db.tenant.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
      await db.tenant.deleteMany({ where: { slug: { in: slugs } } });
      const ids = old.map(row => row.id);
      if (action === "setup") for (const [i, slug] of slugs.entries()) {
        const tenant = await db.tenant.create({ data: { slug, name: "[DỮ LIỆU MẪU] Preview", planId: "premium", status: "active" } });
        ids.push(tenant.id);
        const repo = forTenant(db, tenant.id);
        const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Preview", themeId: i ? "t12" : "t15" });
        await repo.domain.create({ siteId: site.id, hostname: `${slug}.solar.localhost`, status: "active", isPrimary: true, verificationToken: randomUUID() });
        const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU] Owner", role: "owner", email: "owner@example.invalid" });
        const descriptor = { id: "hero", type: "hero", variant: i ? "t12" : "t15", enabled: true };
        const hero = sectionRegistry.types.hero.defaults;
        const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [descriptor], publishedAt: new Date() });
        await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
        await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "hero", type: "hero",
          data: { ...hero, title: { ...hero.title, lead: { vi: "[DỮ LIỆU MẪU] bản chính" } } } });
        await saveDraft(db, tenant.id, { pageId: page.id, expectedRevision: 0, actor: { siteUserId: user.id },
          sections: [{ sectionId: "hero", type: "hero", draftData: { ...hero, title: { ...hero.title, lead: { vi: "[DỮ LIỆU MẪU] nháp" } } } }] });
      }
      // Direct fixture DB writes must invalidate the running web process, including cached negative hosts.
      if (ids.length) {
        const secret = process.env.REVALIDATE_SECRET;
        if (!secret) throw new Error("REVALIDATE_SECRET is required for browser fixtures");
        const body = JSON.stringify({ tags: ids.map(tenantTag), hosts: slugs.flatMap(slug => [`${slug}.solar.localhost`, `${slug}.preview.solar.localhost`]),
          nonce: randomUUID(), ts: Date.now() });
        const response = await fetch(`http://localhost:${port}/api/revalidate`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-signature": signRevalidate(body, secret) }, body,
        });
        if (!response.ok) throw new Error(`Preview fixture invalidation failed: ${response.status}`);
      }
    } else {
      const slug = process.argv[3] ?? slugs[0];
      if (!slugs.includes(slug)) throw new Error("Unknown preview fixture tenant");
      const tenant = await db.tenant.findUniqueOrThrow({ where: { slug }, include: { sites: true } });
      const site = tenant.sites[0];
      const token = await createPreviewToken(db, tenant.id, site.id);
      if (action === "expired") {
        const repo = forTenant(db, tenant.id);
        const row = await repo.previewToken.first({ orderBy: { createdAt: "desc" } });
        await repo.previewToken.update(row!.id, { expiresAt: new Date(0) });
      } else if (action !== "token") throw new Error("Unknown fixture action");
      console.log(token);
    }
  } finally { await db.$disconnect(); }
}
void main();
