const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const tenantPattern = new RegExp(`^tenant:${uuid}(?::site|:page:(?:[a-z0-9_-]+(?:/[a-z0-9_-]+)*)?|:collection:[a-zA-Z][a-zA-Z0-9]*)?$`, "i");
export const tenantTag = (id: string) => `tenant:${id}`;
export const siteTag = (id: string) => `${tenantTag(id)}:site`;
export const pageTag = (id: string, slug: string) => `${tenantTag(id)}:page:${slug}`;
export const collectionTag = (id: string, name: string) => `${tenantTag(id)}:collection:${name}`;
export const isValidTag = (tag: string) => tag.length <= 256 && (tenantPattern.test(tag) || tag === "platform:settings" || tag === "platform:entitlements");
