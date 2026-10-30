"use server";
import { revalidatePath } from "next/cache";
import { action, type ActionResult } from "../../../lib/action.ts";
import { origin } from "../../../lib/auth.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { createStaff } from "../../../lib/staff.ts";
import { changeRoleSchema, inviteSchema, lockSchema, staffIdSchema } from "../../../lib/staffInput.ts";

const service = () => createStaff(getRuntime());
function refreshed(result: ActionResult = { ok: true, message: "Đã cập nhật nhân viên." }) {
  revalidatePath("/nhan-vien");
  return result;
}
export const inviteStaff = action("users.manage", inviteSchema, async (input, c) => {
  const result = await service().invite(c.session!, c.tenantId, input, await origin(c));
  return refreshed({ ok: true, ...result });
});
export const resendStaffInvite = action("users.manage", staffIdSchema, async ({ id }, c) => {
  const result = await service().resendInvite(c.session!, c.tenantId, id, await origin(c));
  return refreshed({ ok: true, ...result });
});
export const changeStaffRole = action("users.manage", changeRoleSchema, async ({ id, role }, c) => {
  await service().changeRole(c.session!, c.tenantId, id, role); return refreshed();
});
export const lockStaff = action("users.manage", lockSchema, async ({ id, locked }, c) => {
  await service().setLocked(c.session!, c.tenantId, id, locked); return refreshed();
});
export const removeStaff = action("users.delete", staffIdSchema, async ({ id }, c) => {
  await service().remove(c.session!, c.tenantId, id); return refreshed({ ok: true, message: "Đã gỡ nhân viên và thu hồi mọi phiên đăng nhập." });
});
export const transferStaffOwner = action("users.transferOwner", staffIdSchema, async ({ id }, c) => {
  await service().transferOwner(c.session!, c.tenantId, id); return refreshed({ ok: true, message: "Đã chuyển quyền chủ sở hữu. Vui lòng đăng nhập lại." });
});
export const convertClientToStaff = action("users.manage", changeRoleSchema, async ({ id, role }, c) => {
  await service().convertClient(c.session!, c.tenantId, id, role); return refreshed();
});
export const convertStaffToClient = action("users.manage", staffIdSchema, async ({ id }, c) => {
  await service().convertToClient(c.session!, c.tenantId, id); return refreshed();
});
