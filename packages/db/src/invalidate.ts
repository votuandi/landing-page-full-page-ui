import { invalidationJob } from "@solar/cache";
import type { TenantRepo } from "./repository.ts";
/** Call inside withTenantTransaction so publication and invalidation commit together. */
export function enqueueInvalidate(repo: Pick<TenantRepo, "outbox">, tags: readonly string[], hosts?: readonly string[]) {
  return repo.outbox.create(invalidationJob(tags, { hosts }));
}
