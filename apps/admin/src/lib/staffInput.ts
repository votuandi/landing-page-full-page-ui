import { z } from "zod";
import { parseLoginId } from "@solar/auth";

export const roleSchema = z.enum(["admin", "editor", "staff", "viewer"], { error: "Vai trò không hợp lệ" });
export type StaffRole = z.infer<typeof roleSchema>;
const badIdentifier = "Vui lòng nhập email hoặc số điện thoại Việt Nam hợp lệ";
// The action only bounds size; inviteSchema's Vietnamese issue reaches the form instead of the generic wrapper error.
export const inviteFormSchema = z.object({ identifier: z.string().max(1000), name: z.string().max(1000), role: z.string().max(20) });
export const inviteSchema = z.object({
  identifier: z.string().trim().min(1, badIdentifier).max(254, badIdentifier),
  name: z.string().trim().min(1, "Vui lòng nhập họ và tên").max(100, "Họ và tên tối đa 100 ký tự"),
  role: roleSchema,
}).transform((value, ctx) => {
  try {
    const loginId = parseLoginId(value.identifier);
    if (loginId.kind === "username") throw new Error();
    return { ...value, loginId };
  } catch {
    ctx.addIssue({ code: "custom", message: badIdentifier });
    return z.NEVER;
  }
});
export const staffIdSchema = z.object({ id: z.uuid() });
export const changeRoleSchema = staffIdSchema.extend({ role: roleSchema });
export const lockSchema = staffIdSchema.extend({ locked: z.enum(["true", "false"]).transform(v => v === "true") });
