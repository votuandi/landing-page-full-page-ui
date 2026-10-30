import { z } from "zod";
import { parseLoginId } from "@solar/auth";

export const roleSchema = z.enum(["admin", "editor", "staff", "viewer"]);
export type StaffRole = z.infer<typeof roleSchema>;
export const inviteSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  name: z.string().trim().min(1).max(100),
  role: roleSchema,
}).transform((value, ctx) => {
  try {
    const loginId = parseLoginId(value.identifier);
    if (loginId.kind === "username") throw new Error();
    return { ...value, loginId };
  } catch {
    ctx.addIssue({ code: "custom", message: "Vui lòng nhập email hoặc số điện thoại Việt Nam hợp lệ" });
    return z.NEVER;
  }
});
export const staffIdSchema = z.object({ id: z.uuid() });
export const changeRoleSchema = staffIdSchema.extend({ role: roleSchema });
export const lockSchema = staffIdSchema.extend({ locked: z.enum(["true", "false"]).transform(v => v === "true") });
