import { isVnMobile, normalizeVnPhone } from "@solar/core";
import type { Lead } from "./types";

export const str = (value: unknown, max = 300) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function cleanEstimate(value: unknown): Lead["estimate"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
    .slice(0, 30)
    .map(([k, v]) => [k.slice(0, 60), typeof v === "string" ? v.slice(0, 200) : v]);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function cleanItems(value: unknown): Lead["items"] {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .slice(0, 50)
    .map((i) => ({ sku: str(i.sku, 80), name: str(i.name, 160), qty: Math.min(999, Math.max(1, Math.floor(Number(i.qty) || 1))) }))
    .filter((i) => i.sku && i.name);
  return items.length ? items : undefined;
}

/** Shared `/api/lead` contract (t15): name + VN mobile required, every other field trimmed and bounded. */
export function parseLead(body: Record<string, unknown>, now = new Date()): { lead: Lead } | { error: string } {
  const phone = normalizeVnPhone(str(body.phone, 30));
  const name = str(body.name, 120);
  if (!name) return { error: "Vui lòng nhập họ tên" };
  if (!isVnMobile(phone)) return { error: "Số điện thoại di động không hợp lệ" };
  return { lead: {
    name, phone,
    zalo: str(body.zalo, 30) || undefined,
    address: str(body.address) || undefined,
    email: str(body.email, 120) || undefined,
    message: str(body.message, 2000) || undefined,
    source: str(body.source, 60).replace(/[^\w-]/g, "") || "website",
    segment: str(body.segment, 60) || undefined,
    province: str(body.province, 60) || undefined,
    businessType: str(body.businessType, 80) || undefined,
    estimate: cleanEstimate(body.estimate),
    items: cleanItems(body.items),
    page: str(body.page, 200) || undefined,
    submittedAt: now.toISOString(),
  } };
}
