"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { action, type ActionContext } from "../lib/action.ts";
import { getRuntime } from "../lib/runtime.ts";
import { origin, requestInfo, setSessionCookie } from "../lib/auth.ts";
import { sealChallenge, openChallenge } from "../lib/challenge.ts";
import { AccountInputError, createAccounts } from "../lib/accounts.ts";

const password = z.string().min(1).max(1024);
const identifier = z.string().trim().min(1).max(254);
const code = z.string().trim().max(20).optional();
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const empty = z.object({});
const service = () => createAccounts(getRuntime());
const challengeName = () => process.env.NODE_ENV === "production" ? "__Host-admin_challenge" : "admin_challenge";
const challengeOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 300 });
async function saveChallenge(context: ActionContext, purpose: string, data: Record<string, string>) {
  (await cookies()).set(challengeName(), sealChallenge(data, context.tenantId, purpose, getRuntime().secret), challengeOptions());
}
async function readChallenge(context: ActionContext, purpose: string) {
  return openChallenge((await cookies()).get(challengeName())?.value, context.tenantId, purpose, getRuntime().secret);
}
async function clearChallenge() { (await cookies()).set(challengeName(), "", { ...challengeOptions(), maxAge: 0 }); }
async function finish(result: Awaited<ReturnType<ReturnType<typeof getRuntime>["realm"]["login"]>>) {
  if (!result.ok) {
    return { ok: false, status: result.reason === "locked" ? 429 : 400, error: result.reason === "temp_password_expired"
      ? "Mật khẩu tạm đã hết hạn. Liên hệ bộ phận hỗ trợ để được cấp lại." : result.message };
  }
  await clearChallenge();
  await setSessionCookie(result.cookie);
  redirect(result.session.mustChangePassword ? "/doi-mat-khau" : "/");
}
export const loginAction = action("public", z.object({ identifier, password }), async (input, context) => {
  const result = await getRuntime().realm.login({ ...input, tenantId: context.tenantId, ...await requestInfo() });
  if (!result.ok && result.reason === "totp_required") {
    await saveChallenge(context, "login", input);
    redirect("/dang-nhap?buoc=totp");
  }
  return finish(result);
});
export const loginTotpAction = action("public", z.object({ code: z.string().trim().min(1).max(20) }), async (input, context) => {
  const pending = await readChallenge(context, "login");
  if (!pending?.identifier || !pending.password) throw new AccountInputError("Yêu cầu đã hết hạn. Vui lòng đăng nhập lại.");
  return finish(await getRuntime().realm.login({ identifier: pending.identifier, password: pending.password, totp: input.code, tenantId: context.tenantId, ...await requestInfo() }));
});
export const logoutAction = action("session", empty, async (_input, context) => {
  const { realm } = getRuntime(), jar = await cookies();
  await realm.logout(jar.get(realm.cookieOptions().name)?.value, { tenantOfHost: context.tenantId });
  jar.set({ ...realm.cookieOptions(), value: "", maxAge: 0 });
  await clearChallenge();
  redirect("/dang-nhap");
});
export const changePasswordAction = action("account.password", z.object({ current: password.optional(), next: password, confirm: password }), async (input, context) => {
  if (input.next !== input.confirm) throw new AccountInputError("Hai mật khẩu mới chưa khớp");
  const { checkPasswordPolicy } = await import("@solar/auth");
  const policy = checkPasswordPolicy(input.next);
  if (!policy.ok) throw new AccountInputError(policy.reason);
  const result = await getRuntime().realm.changePassword(context.session!, { current: input.current ?? "", next: input.next });
  await setSessionCookie(result.cookie);
  redirect("/tai-khoan/khoi-phuc");
});
export const forgotPasswordAction = action("public", z.object({ identifier }), async (input, context) => ({
  ok: true, message: await service().requestLink(context.tenantId, input.identifier, "reset_password", await origin(context), (await requestInfo()).ip),
}));
export const requestMagicAction = action("public", z.object({ identifier }), async (input, context) => ({
  ok: true, message: await service().requestLink(context.tenantId, input.identifier, "magic_link", await origin(context), (await requestInfo()).ip),
}));
export const resetPasswordAction = action("public", z.object({ token, next: password, confirm: password }), async (input, context) => {
  if (input.next !== input.confirm) throw new AccountInputError("Hai mật khẩu mới chưa khớp");
  await service().setPassword(context.tenantId, input.token, input.next, "reset_password", (await requestInfo()).ip);
  (await cookies()).set({ ...getRuntime().realm.cookieOptions(), value: "", maxAge: 0 });
  await clearChallenge();
  redirect("/dang-nhap?da-dat-lai=1");
});
export const acceptInviteAction = action("public", z.object({ token, next: password, confirm: password }), async (input, context) => {
  if (input.next !== input.confirm) throw new AccountInputError("Hai mật khẩu mới chưa khớp");
  const identifier = await service().setPassword(context.tenantId, input.token, input.next, "invite", (await requestInfo()).ip);
  return finish(await getRuntime().realm.login({ identifier, password: input.next, tenantId: context.tenantId, ...await requestInfo() }));
});
export const magicLoginAction = action("public", z.object({ token, code }), async (input, context) => {
  const result = await service().redeemMagic(context.tenantId, input.token, input.code, await requestInfo());
  if (!result.ok && result.reason === "totp_required") {
    await saveChallenge(context, "magic", { token: input.token });
    redirect("/dang-nhap?buoc=magic-totp");
  }
  return finish(result);
});
export const magicTotpAction = action("public", z.object({ code: z.string().trim().min(1).max(20) }), async (input, context) => {
  const pending = await readChallenge(context, "magic");
  if (!pending?.token) throw new AccountInputError("Yêu cầu đã hết hạn. Vui lòng yêu cầu link mới.");
  return finish(await service().redeemMagic(context.tenantId, pending.token, input.code, await requestInfo()));
});
export const beginTotpAction = action("account.totp", empty, async (_input, context) => {
  const pending = await getRuntime().realm.beginTotp(context.session!);
  await saveChallenge(context, "totp-setup", { secret: pending.secret, sessionId: context.session!.id });
  return { ok: true, ...pending, message: "Thêm khóa vào ứng dụng xác thực rồi nhập mã để hoàn tất." };
});
export const enableTotpAction = action("account.totp", z.object({ code: z.string().regex(/^\d{6}$/) }), async (input, context) => {
  const pending = await readChallenge(context, "totp-setup");
  if (!pending?.secret || pending.sessionId !== context.session!.id) throw new AccountInputError("Yêu cầu đã hết hạn. Vui lòng bắt đầu lại.");
  const enabled = await getRuntime().realm.enableTotp(context.session!, pending.secret, input.code);
  await clearChallenge();
  await setSessionCookie(enabled.cookie);
  return { ok: true, codes: enabled.codes, message: "Đã bật xác thực hai bước. Lưu các mã dự phòng này; mỗi mã chỉ dùng được một lần." };
});
export const disableTotpAction = action("account.totp", z.object({ code: z.string().trim().min(1).max(20) }), async (input, context) => {
  const result = await getRuntime().realm.disableTotp(context.session!, input.code);
  await setSessionCookie(result.cookie);
  await clearChallenge();
  return { ok: true, message: "Đã tắt xác thực hai bước" };
});
