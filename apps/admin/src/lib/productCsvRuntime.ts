import { collectionRepository, forTenant, importProductCsv } from "@solar/db";
import { getRuntime } from "./runtime.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { createProductCsvHandlers, type ProductCsvDeps } from "./productCsv.ts";

const deps: ProductCsvDeps = {
  entitlements: getSiteEntitlements,
  // CSV needs the complete reference set; the CMS list's 501-row display cap does not apply.
  list: (tenantId, name) => collectionRepository(forTenant(getRuntime().db, tenantId), name).list({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  import: (tenantId, text, options) => importProductCsv(getRuntime().db, tenantId, text, options),
};
export const productCsvHandlers = createProductCsvHandlers(deps);
