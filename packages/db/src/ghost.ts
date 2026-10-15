import { createHash, randomBytes } from "node:crypto";
import type { Db } from "./client.ts";
import { tenantTransaction } from "./tenantTransaction.ts";

/** DB primitive only; authentication, authorization and revocation checks belong to E15-S03. */
export function redeemGhostGrant(db: Db, tenantId: string, token: string) {
  return tenantTransaction(db, tenantId, async tx => {
    const [grant] = await tx.$queryRaw<{ grantId: string; actorId: string; expiresAt: Date }[]>`
      SELECT * FROM public.redeem_ghost_grant(${token}, ${tenantId}::uuid)`;
    if (!grant) throw new Error("Invalid ghost grant");
    const sessionToken = randomBytes(32).toString("base64url");
    const session = await tx.siteSession.create({ data: {
      tenantId, kind: "ghost", audience: "admin", ghostGrantId: grant.grantId,
      tokenHash: createHash("sha256").update(sessionToken).digest("hex"), expiresAt: grant.expiresAt,
    } });
    return { token: sessionToken, sessionId: session.id, actorId: grant.actorId, expiresAt: session.expiresAt };
  });
}
