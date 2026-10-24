import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { activityLabel, domainLabel, hasSampleMarker, loadDashboard, planLabel, vnDayStart, type DashboardDeps } from "../lib/dashboard.ts";

const now = new Date("2026-10-22T01:00:00Z");
const tenantId = "e7110000-0000-4000-8000-000000000001";
function session(role: Session["role"] = "owner", kind: Session["kind"] = "user"): Session {
  return { id: "session", accountId: tenantId, tenantId, realm: "site", audience: "admin", kind, role,
    permissions: effectivePermissions({ role, kind, audience: "admin" }), expiresAt: new Date(now.getTime() + 60_000), mustChangePassword: false };
}
function setup() {
  const calls: string[] = [];
  const subject = { planId: "basic", status: "active", createdAt: now, addons: [], planExpiresAt: null };
  const deps: DashboardDeps = {
    tenantId,
    async leads() { calls.push("leads"); return { today: 0, week: 0, stale: 0, sources: [] }; },
    async content() { calls.push("content"); return []; },
    async media() { calls.push("media"); return { bytes: 0, subject }; },
    async domain() { calls.push("domain"); return { primary: null, fallback: "demo.solar.vn" }; },
    async plan() { calls.push("plan"); return subject; },
    async activity() { calls.push("activity"); return []; },
  };
  return { deps, calls, subject };
}

test("requires dashboard.view", async () => {
  const { deps, calls } = setup(), user = session();
  await assert.rejects(loadDashboard({ ...user, permissions: new Set() }, deps, now), { status: 403 });
  assert.deepEqual(calls, []);
  await assert.rejects(loadDashboard({ ...user, tenantId: "other" }, deps, now));
  assert.deepEqual(calls, []);
});
test("lead windows use Vietnam day", async () => {
  assert.equal(vnDayStart(now).toISOString(), "2026-10-21T17:00:00.000Z");
  assert.equal(vnDayStart(new Date("2026-10-21T16:59:59Z")).toISOString(), "2026-10-20T17:00:00.000Z");
  assert.equal(vnDayStart(new Date("2026-10-21T17:00:00Z")).toISOString(), "2026-10-21T17:00:00.000Z");
  const { deps } = setup();
  deps.leads = async windows => {
    assert.equal(windows.today.toISOString(), "2026-10-21T17:00:00.000Z");
    assert.equal(windows.week.toISOString(), "2026-10-15T17:00:00.000Z");
    assert.equal(windows.stale.toISOString(), "2026-10-21T01:00:00.000Z");
    assert.equal(windows.now, now);
    return { today: 1, week: 2, stale: 0, sources: [{ source: "lead-form" }, { source: "calculator" }] };
  };
  const result = await loadDashboard(session(), deps, now);
  assert.equal(result.leads?.today, 1); assert.equal(result.leads?.week, 2);
});
test("leads grouped by source", async () => {
  const { deps } = setup();
  deps.leads = async () => ({ today: 5, week: 5, stale: 0, sources: ["lead-form", "calculator", "lead-form", "lead-form", "a-source"].map(source => ({ source })) });
  assert.deepEqual((await loadDashboard(session(), deps, now)).leads?.sources,
    [{ source: "lead-form", count: 3 }, { source: "a-source", count: 1 }, { source: "calculator", count: 1 }]);
});
test("sample marker detection", async () => {
  for (const value of [null, 42, false, "{broken", {}, [null, {}]]) assert.equal(hasSampleMarker(value), false);
  assert.equal(hasSampleMarker({ vi: [null, { text: "Tên [DỮ LIỆU MẪU]" }] }), true);
  assert.equal(hasSampleMarker({ en: "[SAMPLE DATA]" }), true);
  const { deps } = setup();
  deps.content = async () => [
    { id: "a", slug: "", title: { vi: "Trang chủ" }, draftSections: null, sectionContents: [
      { data: { vi: "[DỮ LIỆU MẪU]" }, draftData: { en: "[SAMPLE DATA]" } }, { data: null, draftData: "[SAMPLE DATA]" },
    ] },
    { id: "b", slug: "clean", title: null, draftSections: [], sectionContents: [{ data: "broken", draftData: null }] },
  ];
  const content = (await loadDashboard(session(), deps, now)).content!;
  assert.deepEqual(content.samples, [{ id: "a", title: "Trang chủ", sectionCount: 2, href: "/trang/a" }]);
  assert.deepEqual(content.drafts.map(p => p.id), ["a", "b"]);
});
test("media usage vs plan limit", async () => {
  const { deps, subject } = setup();
  deps.media = async () => ({ bytes: 512 * 1024 ** 2, subject });
  let media = (await loadDashboard(session(), deps, now)).media!;
  assert.equal(media.label, "0,5 / 1 GB"); assert.equal(media.percent, 50); assert.equal(media.warning, false);
  deps.media = async () => ({ bytes: 2 * 1024 ** 3, subject: { ...subject, limitOverrides: { mediaGb: { add: 1, reason: "test" } } } });
  media = (await loadDashboard(session(), deps, now)).media!;
  assert.equal(media.limitGb, 2); assert.equal(media.percent, 100); assert.equal(media.warning, true);
  deps.media = async () => ({ bytes: 2 * 1024 ** 3, subject });
  assert.equal((await loadDashboard(session(), deps, now)).media?.percent, 200);
  for (const size of [0, 100]) {
    deps.media = async () => ({ bytes: size, subject: { ...subject, planId: "unknown" } });
    media = (await loadDashboard(session(), deps, now)).media!;
    assert.ok(Number.isFinite(media.percent)); assert.equal(media.warning, size > 0);
  }
});
test("domain status labels", () => {
  assert.equal(domainLabel("active"), "Đang hoạt động · SSL");
  assert.equal(domainLabel("pending"), "Chờ xác minh");
  assert.equal(domainLabel("error"), "Lỗi tên miền · cần kiểm tra");
});
test("plan tile", () => {
  const subject = setup().subject;
  assert.deepEqual(planLabel({ ...subject, planId: "pro", planExpiresAt: new Date("2026-10-27T01:00:00Z") }, now),
    { name: "Nâng cao", expiry: "Hết hạn 27/10/2026", warning: true });
  assert.equal(planLabel(subject, now).expiry, "Không thời hạn");
  assert.equal(planLabel({ ...subject, status: "trial" }, now).name, "Dùng thử");
  assert.equal(planLabel({ ...subject, planExpiresAt: new Date("2026-10-21") }, now).warning, true);
  assert.equal(planLabel({ ...subject, planExpiresAt: new Date("2026-11-22") }, now).warning, false);
});
test("activity labels and limit", async () => {
  assert.equal(activityLabel("ghost.start"), "Truy cập hỗ trợ");
  assert.equal(activityLabel('unknown "☀"'), 'unknown "☀"');
  const { deps } = setup();
  deps.activity = async () => Array.from({ length: 12 }, (_, i) => ({ id: String(i), action: i === 11 ? "ghost.start" : "custom", createdAt: new Date(now.getTime() + i * 1000) }));
  const activity = (await loadDashboard(session(), deps, now)).activity!;
  assert.equal(activity.length, 10); assert.equal(activity[0].id, "11"); assert.equal(activity[0].label, "Truy cập hỗ trợ");
});
test("tiles follow permissions", async () => {
  for (const [role, expected] of [
    ["viewer", ["content", "media"]], ["editor", ["content", "media"]], ["staff", ["leads", "media"]],
    ["owner", ["leads", "content", "media", "domain", "plan", "activity"]],
  ] as const) {
    const { deps, calls } = setup(), result = await loadDashboard(session(role), deps, now);
    assert.deepEqual(calls.sort(), [...expected].sort());
    assert.deepEqual(Object.entries(result).filter(([, value]) => value !== undefined).map(([key]) => key).sort(), [...expected].sort());
  }
  const { deps, calls } = setup();
  await loadDashboard(session("owner", "ghost"), deps, now);
  assert.equal(calls.length, 6);
});
test("viewer never queries leads", async () => {
  const { deps } = setup();
  deps.leads = async () => { assert.fail("viewer must never query leads"); };
  assert.equal((await loadDashboard(session("viewer"), deps, now)).leads, undefined);
});
test("empty site", async () => {
  const result = await loadDashboard(session(), setup().deps, now);
  assert.deepEqual(result.leads, { today: 0, week: 0, stale: 0, sources: [] });
  assert.deepEqual(result.content, { samples: [], drafts: [] });
  assert.equal(result.media?.percent, 0); assert.equal(result.media.label, "0 / 1 GB");
  assert.equal(result.domain?.hostname, "demo.solar.vn"); assert.equal(result.domain.label, "Tên miền nền tảng");
  assert.deepEqual(result.activity, []);
});
test("loader error propagates", async () => {
  const { deps } = setup();
  deps.media = async () => { throw new Error("database unavailable"); };
  await assert.rejects(loadDashboard(session(), deps, now), /database unavailable/);
});
