"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { action } from "../../../../lib/action.ts";
import { createStaff } from "../../../../lib/staff.ts";
import { getRuntime } from "../../../../lib/runtime.ts";

export const logoutOtherSessions = action("account.totp", z.object({}), async (_input, context) => {
  await createStaff(getRuntime()).logoutOtherSessions(context.session!, context.tenantId);
  revalidatePath("/tai-khoan/bao-mat");
  return { ok: true, message: "Đã đăng xuất các thiết bị khác. Phiên hiện tại được giữ lại." };
});
