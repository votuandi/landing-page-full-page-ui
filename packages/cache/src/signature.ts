import { createHmac, timingSafeEqual } from "node:crypto";
export const signRevalidate = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("hex");
export function verifyRevalidate(body: string, signature: string, secret: string) {
  if (!/^[0-9a-f]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(signRevalidate(body, secret), "hex"));
}
