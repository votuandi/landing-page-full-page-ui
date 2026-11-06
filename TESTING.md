# Chiến lược test

Giữ `node:test` theo [D15](roadmap/02-decisions.md#d15-test-logic-nghiệp-vụ-bằng-nodetest),
không thêm Vitest hay Testcontainers. CI dùng Node 22; cổng coverage cần Node ≥ 22.8.
Chạy `node scripts/agents/doctor.mjs` trước test; lệnh dài qua
`node scripts/agents/doctor.mjs run --idle 3 -- <lệnh>`, ghi log ra file.

## Các lớp test

| Lớp | Vị trí và mục đích | Lệnh |
|---|---|---|
| Unit | `packages/*/src/__tests__`, riêng core/plans có `__tests__` ở gốc; logic, token, entitlement, schema section | `pnpm --filter @solar/<package> test` |
| Contract | `packages/storage/src/__tests__/contract.ts`: `runContract` dùng chung cho local và S3/MinIO; `packages/leads/src/__tests__/contract.test.ts`: email, Telegram, webhook, Google Sheets dùng chung bảng trạng thái và lỗi mạng | `pnpm --filter @solar/storage test`; `pnpm --filter @solar/leads test` |
| Integration | `packages/db/src/__tests__`, `packages/auth/src/__tests__`, `packages/cache/src/__tests__`: repository với Postgres thật, RLS và Redis | `bash scripts/local-ci.sh up`, rồi `bash scripts/local-ci.sh db` |
| E2E | `tooling/visual/*.spec.ts`: hành vi người dùng trên trình duyệt thật, môi trường tenant/preview/admin/production | `bash scripts/local-ci.sh e2e <tenant\|preview\|admin\|production\|sections>` |
| Visual | `tooling/visual/visual.spec.ts`, `matrix.spec.ts`, `playwright.matrix.config.ts`: ảnh trang và ma trận theme/variant | Xem [hướng dẫn visual](tooling/visual/README.md) và bộ kiểm do `scripts/ci/checks-map.mjs` chọn |

`*.test.ts`/`*.test.tsx` là test Node TypeScript; một số package dùng `*.test.mjs` thuần ESM.
`*.int.test.ts` dành cho tích hợp, skip khi thiếu env dịch vụ; một số test repository cũ chưa có hậu tố này,
kiểm tra điều kiện skip trong file. `contract.ts` là bộ assertion dùng lại, `contract.test.ts` là entry chạy test.
Runner hiện có dùng `tsc` sang `.test-dist`, `tsx`, hoặc `scripts/test.mjs` để liệt kê file;
script coverage đọc lại `scripts.test`, riêng auth/cms-ui/db dùng glob tương đương runner.
Thêm test vào danh sách của runner khi package liệt kê file tường minh.

Postgres 16 + Redis được dựng bằng compose của `local-ci.sh up`, cùng role, migrate, seed với service CI.
Nạp env `.env.ci.local` trước khi chạy trực tiếp package. Không dùng mock DB để thay bằng chứng RLS/repository thật.
Storage cần MinIO để chạy contract S3; xem README package và cấu hình trong `local-ci.sh`.

## Cổng độ phủ dòng

| Package | Ngưỡng | Nguồn tính coverage |
|---|---|---|
| `@solar/core` | 85% | `.test-dist`, loại test/fixture theo script có sẵn |
| `@solar/tokens` | 70% | `.test-dist/**` |
| `@solar/plans` | 70% | `.test-dist/*.js` (nguồn ở gốc package) |
| `@solar/sections` | 70% | `.test-dist/sections/src/**` |
| `@solar/ui` | 70% | `.test-dist/ui/src/**` |
| `@solar/themes` | 70% | `src/**` |
| `@solar/presets` | 70% | `src/**` |
| `@solar/storage` | 70% | `src/**` |
| `@solar/leads` | 70% | `src/**` |
| `@solar/env` | 70% | `src/**` |
| `@solar/cache` | 70% | `src/**` |
| `@solar/cms-ui` | 70% | `src/**` |
| `@solar/auth` | 70% | `src/**` |
| `@solar/db` | 70% | `src/**`, đo trong job có Postgres |

Chạy `pnpm --filter @solar/<package> test:coverage` để đo riêng;
`pnpm turbo run test:coverage --filter=!@solar/db` chạy cổng trong job `verify`.
Job `db` chạy `pnpm --filter @solar/db test:coverage` với Postgres/RLS, thay lần test thường.
Helper `scripts/ci/coverage.mjs` chèn cờ Node vào mọi token `--test`, giữ nguyên bước biên dịch,
giới hạn include về nguồn của chính package, loại `**/__tests__/**` và `**/*.test.*`.
Lệnh không có `--test` hoặc tham số sai bị từ chối; dưới ngưỡng trả exit khác 0.
`node --test scripts/ci/coverage.test.mjs` kiểm helper và chặn package mới có test nhưng thiếu cổng.

**Giới hạn:** Node chỉ đo file mà test thực sự nạp, không phải tất cả file nguồn trong package.
Kiểm bảng file trong báo cáo cùng tỷ lệ; include sai có thể cho bảng rỗng 100%.
`ui` hiện chỉ nạp `mediaUrl.ts`; component React cần e2e/visual. Khi DB/Redis bị skip,
số đo auth/cache/db không đại diện cho lần chạy có dịch vụ; phải ghi rõ môi trường.
`packages/config` không có test nên chưa có cổng. `apps/*` nằm ngoài cổng package,
có unit/integration hiện hữu và e2e cho luồng ứng dụng; `tooling/eslint-plugin` nằm ngoài `packages/*`.

## Luồng e2e và khoảng trống

| Luồng | Bằng chứng hiện có | Phần tiếp theo |
|---|---|---|
| Xem trang → dự toán → gửi lead | `conversion.spec.ts` kiểm segment/dự toán/prefill; `turnstile.spec.ts` kiểm gửi lead | E14-S02 nối toàn bộ luồng và xác nhận lead trong CMS trên t08/t12/t15 |
| CMS sửa → revalidate | `production.spec.ts`: tenant revalidate và nội dung production; `admin.spec.ts`: chỉnh nội dung | E14-S02 bổ sung khi cần trong luồng chuyển đổi |
| Thêm tên miền | `admin.spec.ts`: các case tên miền E11-S06 | Duy trì trong bộ admin |

## Chọn phạm vi và xử lý flaky

Theo [AGENTS.md §3](AGENTS.md#3-lệnh): story thường chạy unit/int package bị ảnh hưởng và e2e mới/sửa;
regression toàn bộ theo nhịp 6 PR trong `roadmap/regression.json`.
`scripts/ci/checks-map.mjs` là bảng chọn chung cho local và CI; visual/matrix chỉ bật khi đầu vào pixel đổi
hoặc story regression. Sandbox Codex không chạy turbo, Prisma generate, Docker, dev server hay Playwright;
Claude chạy các phần này. Xem mục **Test flaky đã biết** trong [README visual](tooling/visual/README.md)
để xem bằng chứng và story xử lý; không tăng retry hoặc bỏ test để che lỗi.
