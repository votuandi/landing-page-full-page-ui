import { forTenant, collectionRepository, saveCollectionItem, duplicateCollectionItem, deleteCollectionItem, reorderCollection } from "@solar/db";
import { getTenant, requirePagePermission } from "./auth.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import type { CollectionsDeps } from "./collections.ts";

export const collectionDeps: CollectionsDeps = {
  requirePermission: requirePagePermission, tenant: getTenant, entitlements: getSiteEntitlements,
  list: (tenantId, name) => collectionRepository(forTenant(getRuntime().db, tenantId), name).list({ orderBy: [{ order: "asc" }, { id: "asc" }], take: 501 }),
  count: (tenantId, name) => collectionRepository(forTenant(getRuntime().db, tenantId), name).count(),
  item: (tenantId, name, id) => collectionRepository(forTenant(getRuntime().db, tenantId), name).get(id),
  save: (tenantId, name, input) => saveCollectionItem(getRuntime().db, tenantId, name, input),
  duplicate: (tenantId, name, id) => duplicateCollectionItem(getRuntime().db, tenantId, name, id),
  remove: (tenantId, name, id) => deleteCollectionItem(getRuntime().db, tenantId, name, id),
  reorder: (tenantId, name, ids) => reorderCollection(getRuntime().db, tenantId, name, ids),
};
