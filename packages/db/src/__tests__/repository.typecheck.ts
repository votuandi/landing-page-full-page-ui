import { forTenant } from "../repository.ts";
import type { Db } from "../client.ts";

// Compiled by typecheck only: callers cannot override the repository tenant.
function repositoryTypes(db: Db, tenantId: string) {
  const repo = forTenant(db, tenantId);
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
