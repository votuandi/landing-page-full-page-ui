import assert from "node:assert/strict";
import test from "node:test";
import type { TenantRepo } from "../repository.ts";
import { rotateTenantIntegrationSecrets } from "../secretsRotate.ts";

function fixture() {
  const rows = [{ id: "integration-A", configEncrypted: "old" }, { id: "integration-B", configEncrypted: "test" }];
  const audits: unknown[] = [];
  const repo = {
    leadIntegration: {
      list: async (args: { where?: { id: { gt: string } } }) => rows.filter(row => !args.where || row.id > args.where.id.gt),
      update: async (id: string, data: { configEncrypted: string }, expected: { configEncrypted: string }) => {
        const row = rows.find(row => row.id === id && row.configEncrypted === expected.configEncrypted);
        if (!row) return { count: 0 };
        Object.assign(row, data); return { count: 1 };
      },
    },
    auditLog: { create: async (data: unknown) => { audits.push(data); } },
  } as unknown as Pick<TenantRepo, "leadIntegration" | "auditLog">;
  return { repo, rows, audits };
}
test("rotate truyền đúng context tenant/bản ghi vào callback", async () => {
  const { repo } = fixture();
  const contexts: unknown[] = [];
  await rotateTenantIntegrationSecrets(repo, "tenant-A", (value, context) => { contexts.push(context); return value; });
  assert.deepEqual(contexts, [{ tenantId: "tenant-A", integrationId: "integration-A" }, { tenantId: "tenant-A", integrationId: "integration-B" }]);
});
test("chạy lại rotated=0 không ghi thêm audit dù có legacy skipped", async () => {
  const { repo, audits } = fixture();
  const rotate = (value: string) => value === "test" ? null : "new";
  assert.deepEqual(await rotateTenantIntegrationSecrets(repo, "tenant-A", rotate), { rotated: 1, skipped: 1 });
  assert.equal(audits.length, 1);
  assert.deepEqual(await rotateTenantIntegrationSecrets(repo, "tenant-A", rotate), { rotated: 0, skipped: 1 });
  assert.equal(audits.length, 1);
});
