import { ForbiddenError, MustChangePasswordError, UnauthenticatedError, type Permission, type Session } from "@solar/auth";

export type Access = Permission | "session";
export function authorize(session: Session | null, tenantId: string, permission: Access): Session {
  if (!session || session.realm !== "site" || session.audience !== "admin" || session.tenantId !== tenantId || session.role === "client") throw new UnauthenticatedError();
  if (session.mustChangePassword && permission !== "account.password" && permission !== "session") throw new MustChangePasswordError();
  if (permission !== "session" && !session.permissions.has(permission)) throw new ForbiddenError();
  return session;
}
