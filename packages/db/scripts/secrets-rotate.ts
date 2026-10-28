import { loadEnv, workerEnv } from "@solar/env";
import { decryptSecret, encryptSecret, needsRotation } from "@solar/env/secrets";
import { createPlatformDb, rotateIntegrationSecrets } from "../src/index.ts";

loadEnv(workerEnv);
// Validate the key ring before opening the database, including an empty database.
encryptSecret("", undefined, { tenantId: "startup", integrationId: "key-check" });
const db = createPlatformDb({ pool: 2 });
try {
  const result = await rotateIntegrationSecrets(db, (value, context) => {
    if (!value.startsWith("v1.")) return null;
    return needsRotation(value, undefined, context) ? encryptSecret(decryptSecret(value, undefined, context), undefined, context) : value;
  });
  console.log(JSON.stringify({ action: "secrets.rotate", ...result }));
} catch {
  console.error("[secrets.rotate] Không thể xoay khóa; kiểm tra cấu hình và thử lại");
  process.exitCode = 1;
} finally { await db.$disconnect(); }
