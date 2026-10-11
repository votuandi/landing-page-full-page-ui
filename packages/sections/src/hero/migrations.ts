import { heroSchema } from "./schema";

/** v2 adds optional slides; existing hero content stays intact. */
export function migrateHeroV1(data: unknown) {
  return heroSchema.parse(data);
}
