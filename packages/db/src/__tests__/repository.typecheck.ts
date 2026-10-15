import { forPlatform, forTenant } from "../repository.ts";
import type { Db } from "../client.ts";

// Compiled by typecheck only: callers cannot override the repository tenant.
function repositoryTypes(db: Db, tenantId: string) {
  // @ts-expect-error runtime realm cannot change tenant plans
  forPlatform(db).tenants.changePlan({ actorId: "id", tenantId, changes: { planId: "basic" } });
  // @ts-expect-error runtime realm cannot run cross-tenant billing
  forPlatform(db).billing.run();
  db.$transaction(async tx => {
    // @ts-expect-error transaction has not been bound to a tenant context
    forTenant(tx, tenantId);
  });
  const repo = forTenant(db, tenantId);
  // @ts-expect-error section type is immutable after create
  repo.sectionContent.update("id", { type: "hero" });
  // @ts-expect-error Prisma set operations cannot change section type either
  repo.sectionContent.update("id", { type: { set: "hero" } });
  // @ts-expect-error tenantId belongs to the repository scope
  repo.project.create({ slug: "x", title: {}, tenantId });
  // @ts-expect-error nested tenant writes cannot replace the repository scope
  repo.project.update("id", { tenant: { connect: { id: tenantId } } });
  // @ts-expect-error top-level tenant filters belong to the repository scope
  repo.project.list({ where: { tenantId } });
  const rows = repo.project.list({ select: { id: true } });
  rows.then((projects) => {
    const id: string = projects[0].id;
    // @ts-expect-error selection excludes slug from the result
    const slug: string = projects[0].slug;
    return { id, slug };
  });
}
void repositoryTypes;
