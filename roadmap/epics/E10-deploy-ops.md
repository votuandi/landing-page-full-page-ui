# E10 — Triển khai VPS & AWS, vận hành

**Mục tiêu**: cùng một bộ image Docker chạy được trên VPS (docker compose + Caddy) và AWS; đổi môi trường bằng biến,
không sửa code.
**Target epic**: dựng môi trường VPS mới từ đầu ≤ 30 phút bằng script; deploy không gián đoạn (zero-downtime);
RPO ≤ 24 h, RTO ≤ 2 h; uptime site ≥ 99,9%/tháng.
**Phụ thuộc**: E1. Chạy song song với E5.

---

### E10-S01 · Image Docker cho `web`, `admin` và `console` ✅ · PR [#68](https://github.com/votuandi/landing-page-full-page-ui/pull/68)
**Là** dev vận hành, **tôi muốn** image nhỏ, build một lần chạy mọi nơi, **để** deploy nhanh và nhất quán.
- **Chi tiết**: Dockerfile đa giai đoạn dùng `turbo prune --docker` + Next `output: "standalone"`; Prisma client gộp
  vào image; user không root; healthcheck `/api/health` (kiểm DB, Redis). Thay Dockerfile cũ (đang tham chiếu prisma
  của develop). Tag image theo commit SHA, đẩy lên GHCR (và ECR cho AWS).
- **Target**: image `web` ≤ 250 MB; khởi động ≤ 5 s.
- **AC**: [x] CI build và đẩy image khi merge — workflow `Images` run 40191894668: smoke + push GHCR `<repo>-web|admin:<sha>` (ECR khi có biến AWS; console thêm ở E15-S02) ·
  [x] Container chạy với `read_only: true` (trừ thư mục tạm/khi dùng storage local) — `infra/docker/smoke.sh` (web 242,8 MB, khởi động ~2,9 s).
- Agent: Codex · Cỡ: M

### E10-S02 · Môi trường VPS: compose + Caddy
**Là** chủ dự án, **tôi muốn** chạy toàn bộ nền tảng trên một VPS giá rẻ, **để** chi phí thấp giai đoạn đầu.
- **Chi tiết**: `infra/vps/docker-compose.yml`: `caddy` (on-demand TLS, phục vụ media local qua `file_server` tại
  `media.<platform>`), `web` ×2 bản sao, `admin` (`*.admin.<platform>`), `console` (`console.<platform>`, D17), `worker`
  (xử lý ảnh, job DNS, cron), `postgres:16`, `redis:7`.
  Script `infra/vps/bootstrap.sh` (Ubuntu 24.04: Docker, firewall chỉ mở 22/80/443, fail2ban, swap, unattended-upgrades).
  Deploy: `deploy.sh <sha>` kéo image, chạy migration, rolling restart từng bản `web` (Caddy health-check `lb_policy`).
- **Target**: VPS 4 vCPU/8 GB phục vụ ≥ 200 tenant ở mức traffic SME.
- **AC**:
  - [ ] Từ VPS trắng → site demo HTTPS chạy trong ≤ 30 phút làm theo README.
  - [ ] Deploy phiên bản mới: không có request lỗi 5xx (đo bằng k6 trong lúc deploy).
- Phụ thuộc: S01, S09, E9-S02 · Agent: Codex · Cỡ: L

### E10-S03 · Cache ISR dùng chung (Redis) ✅ · PR [#69](https://github.com/votuandi/landing-page-full-page-ui/pull/69)
**Là** chủ dự án, **tôi muốn** mọi bản `web` thấy cùng một cache, **để** khách lưu nội dung là mọi người thấy bản mới.
- **Chi tiết**: cài hợp đồng data cache `packages/cache` của E5-S05 và `cacheHandlers.default`
  (`"use cache"`, Next 16) bằng Redis. Không cấu hình `cacheHandler` ISR/route: route tenant động không đi qua incremental
  cache; route tĩnh build sẵn giữ handler mặc định để đọc được bản build. Chống dữ liệu cũ do cạnh tranh:
  - Mỗi tag có **dấu thời gian vô hiệu hóa bền vững** trong Redis (`tag:<t>:invalidatedAt`); entry cache lưu thời điểm bắt đầu
    render; khi đọc, entry bắt đầu trước `invalidatedAt` của bất kỳ tag nào → coi như hết hạn. Nhờ vậy render đang chạy dở
    ghi lại bản cũ cũng không được phục vụ.
  - Pub/sub chỉ để xóa cache bộ nhớ cục bộ nhanh; mất kết nối → khi kết nối lại, xóa toàn bộ cache cục bộ (không tin pub/sub).
  - Chống dồn render (stampede): khóa ngắn `SET NX` theo key, instance khác phục vụ bản cũ hợp lệ trong lúc chờ.
  - Không có `REDIS_URL` → cache bộ nhớ (dev).
- **AC**:
  - [x] Test: 2 instance, revalidate qua instance A → instance B trả bản mới ở request kế tiếp.
  - [x] Test cạnh tranh: render chậm bắt đầu trước invalidation, ghi xong sau → không được phục vụ.
  - [x] Restart Redis / ngắt pub/sub giữa chừng → không instance nào phục vụ bản đã bị vô hiệu hóa.
  - [x] 100 request đồng thời vào key hết hạn → 1 lần render.
  - [x] Redis chết → site vẫn phục vụ (fallback render, cảnh báo), không 500.
- Phụ thuộc: E5-S05 (hợp đồng) · Agent: Claude (review Codex adversarial) · Cỡ: L

### E10-S04 · Môi trường AWS
**Là** chủ dự án, **tôi muốn** chạy được trên AWS khi khách lớn yêu cầu, **để** mở rộng và đáp ứng hợp đồng doanh nghiệp.
- **Chi tiết**: IaC (AWS CDK TypeScript, cùng ngôn ngữ với repo) trong `infra/aws`: VPC, ECS Fargate (`web` autoscale 2–10,
  `admin`, `console`, `worker`), ALB, RDS Postgres (Multi-AZ tùy chọn), ElastiCache Redis, S3 (media) + CloudFront, Secrets Manager,
  CloudWatch. Tên miền khách đi qua **Cloudflare for SaaS** (E9-S03) → ALB (ALB không hỗ trợ on-demand TLS).
  Tùy chọn rẻ hơn: Lightsail/EC2 + chính bộ compose của VPS.
- **AC**:
  - [ ] `cdk deploy` dựng môi trường staging từ đầu.
  - [ ] Cùng image Docker với VPS; khác nhau chỉ ở biến môi trường.
  - [ ] Ước tính chi phí hàng tháng ghi trong `infra/aws/README.md`.
- Phụ thuộc: S01, S03, S09, E8-S01, E9-S03 · Agent: Codex · Cỡ: L

### E10-S05 · Cấu hình & bí mật ✅ · PR [#70](https://github.com/votuandi/landing-page-full-page-ui/pull/70)
- **Chi tiết**: `packages/env` kiểm biến môi trường bằng zod lúc khởi động (thiếu → không start, thông báo rõ); bí mật tích hợp
  của tenant (token Telegram, webhook) mã hóa AES-GCM bằng khóa `APP_ENCRYPTION_KEY` (hỗ trợ xoay khóa). `.env.example` đầy đủ.
  Secret phiên riêng cho từng realm (`ADMIN_SESSION_SECRET`, `CONSOLE_SESSION_SECRET`, D17); `DATABASE_URL` của console dùng
  role `app_platform`, của web/admin dùng `app_runtime` (E5-S09).
- **AC**: [x] Thiếu `DATABASE_URL` → container dừng với thông báo — `infra/docker/smoke.sh` web/admin: exit 1, log chỉ có tên biến ·
  [x] Không bí mật nào nằm trong log — `packages/env` test sentinel + smoke không thấy `DATABASE_URL`/session secret trong log.
- Agent: Codex · Cỡ: S

### E10-S06 · Sao lưu & khôi phục
- **Chi tiết**: `pg_dump` hằng ngày (giữ 7 ngày + 4 tuần + 3 tháng) đẩy lên object storage khác vùng/nhà cung cấp; media local
  đồng bộ `rclone` sang R2/S3 hằng ngày; diễn tập khôi phục mỗi quý có checklist.
  Bản backup gồm DB + media + **khóa mã hóa** (`APP_ENCRYPTION_KEY`, lưu riêng trong kho bí mật) — thiếu khóa thì bí mật tích hợp
  của tenant không giải mã được.
- **AC**: [ ] Diễn tập khôi phục DB + media + khóa lên VPS mới, site và kênh lead hoạt động trong ≤ 2 h · [ ] Cảnh báo nếu backup thất bại.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E10-S07 · Quan sát & cảnh báo
- **Chi tiết**: log JSON có `tenantId`, `requestId`; OpenTelemetry → Grafana Cloud/Better Stack (gói miễn phí) hoặc CloudWatch;
  uptime check cho từng tên miền `active`; cảnh báo Telegram cho đội vận hành (5xx > 1%, p95 > 1 s, disk > 80%, cert lỗi).
  Sentry (hoặc GlitchTip tự host) cho lỗi frontend/backend.
- **AC**: [ ] Dashboard theo tenant: request, lỗi, p95 · [ ] Gây lỗi giả → cảnh báo trong ≤ 5 phút.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E10-S08 · CD theo môi trường
- **Chi tiết**: `main` → staging tự động; tag `v*` → production cần duyệt tay; migration DB chạy trước khi đổi image và phải
  tương thích ngược (expand/contract).
- **AC**: [ ] Rollback về image trước bằng một lệnh ≤ 5 phút; image cũ chạy được trên schema mới (expand/contract) ·
  [ ] Test rolling deploy: bản cũ và mới chạy song song 5 phút không lỗi · [ ] Migration lỗi giữa chừng → dừng deploy, image cũ tiếp tục phục vụ.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: S

### E10-S09 · Sửa lỗi: trang vừa publish không được phục vụ từ cache trước khi invalidate ✅ · PR [#76](https://github.com/votuandi/landing-page-full-page-ui/pull/76)
**Là** chủ dự án, **tôi muốn** biết chắc cache trang chạy đúng hợp đồng, **để** tải trên VPS đi qua cache và job `db` đỏ luôn là lỗi thật.
- **Hiện tượng**: `tooling/visual/production.spec.ts:37`, dòng 47: sau `fixture("publish")`, chưa gọi `/api/revalidate`, test mong còn bản cache
  `A body 0` nhưng trang trả `A body 1`. Đây là cache miss sớm, không phải nội dung cũ hay nội dung của tenant khác.
- **Bằng chứng** (PR #75, job `db`): đỏ ở `43baff1` (run 41181583246) và `4bc9ba2` (run 41302420951, cả hai lần chạy); xanh ở `a945ec6`, `89b37ab`,
  `e8879c8` và local. PR không đổi `apps/web`, `packages/cache`, nên có thể là lỗi có sẵn, nhưng **chưa chạy trên base**.
- **Giả thuyết chưa kiểm**: `cacheLife` (`stale`/`revalidate` 60 s, `TENANT_CACHE_LIFE`); so sánh thời điểm render với `tag:<t>:invalidatedAt` ngay sau
  lượt invalidate ở `beforeAll`; hai server 3210/3213 dùng chung Redis; Next 16.4.3 (PR #72, lần regression trước còn 16.3.8);
  bản thân `publishPage` tự vô hiệu hóa cache. Test có `retries: 0` nên lần đỏ đầu là đỏ cả job.
- **Chi tiết**: chạy test trên merge-base trước để biết có hồi quy không; ghi log cache hit/miss quanh dòng 47 để lấy nguyên nhân gốc;
  sửa ở cache nếu là lỗi thật, hoặc sửa spec nếu ý đồ test sai, kèm giải thích. Sửa xong rà `TENANT_CACHE_LIFE` có đúng target TTFB của E5 không.
- **Nguyên nhân gốc** (đo trên base `8491804`, 01/11/2026): spec sai, cache đúng. `beforeAll` invalidate `tenant:<id>`, đồng hồ tag = `now() + 1000 ms`
  (`skewMs`, biên lệch đồng hồ giữa các máy, có chủ đích từ `85e0992`, E10-S03, PR #69). Handler chỉ nhận entry có `timestamp > clock`, nên render trang A bắt đầu
  trong 1 s sau đó không bao giờ được giữ; dòng 47 render lại và thấy `A body 1`. Máy càng nhanh càng dễ đỏ. Assertion có từ `410d78d`, lỗi xuất hiện khi `85e0992` thêm biên.
  Log hit/miss, `--repeat-each=10`, hai lần đọc đầu sau `fixture("publish")`, `timestamp - clock` (ms): lần 1, 6, 7 HIT (+921/+952, +83/+111, +240/+275) → xanh; lần 8
  MISS −20, HIT +19 → xanh; lần 2, 4, 5, 9, 10 MISS cả hai (−389…−82) → đỏ tại dòng 47. Không có lượt invalidate nào giữa `publish` và dòng 47: `publishPage` chỉ ghi outbox,
  spec không chạy worker. Lần 3 đỏ vì `fixture("publish")` `spawnSync ETIMEDOUT` 60 s, một lần trên Windows, không lặp lại ở 7 lần còn lại và 10 lượt sau sửa, không có trên CI, chưa rõ nguyên nhân.
  Chưa đo vì sao lỗi chỉ lộ ở PR #75 mà không ở #69–#74.
- **Sửa**: giữ biên và dòng 47; `beforeAll` chờ 1,5 s sau invalidate để render của test nằm ngoài biên. Sau sửa local `production.spec.ts` 60/60 qua 10 lượt. Thêm test
  "skew margin ends" ghim phía HIT; test `AC3 real restart` chờ qua floor để cả bộ chạy cùng lượt khi có `REDIS_RESTART_CMD`.
- **Rà `TENANT_CACHE_LIFE`**: giữ nguyên `{ stale: 60, revalidate: 60, expire: 86400 }`. `ttfb-compare` có Redis, run [41312667391](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/41312667391),
  median (p95) của head: `/` 48,1 ms (52,1), `/lien-he` 20,2 ms (26,4), `/san-pham` 22,9 ms (25,9), đều dưới target E5 p75 ≤ 200 ms. Quá `revalidate` handler vẫn trả entry và render nền nên
  TTFB không tăng; 60 s khớp target "trang mới ≤ 60 s". Biên 1 s chỉ thêm render ngay sau invalidate.
- **AC**:
  - [x] Nguyên nhân gốc ghi trong story, có log hit/miss chứng minh, và nói rõ lỗi có sẵn từ commit nào.
  - [x] `production.spec.ts` xanh 10/10 lần liên tiếp trên CI, không thêm `retries`, không gắn `@quarantine`, không bỏ assertion dòng 47 nếu chưa chứng minh nó sai.
    PR #76, `repeatEach: 10` tạm: job `db` run [41312662666](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/41312662666), 60 passed (5.5m), đã revert.
  - [x] Toàn bộ test E10-S03 vẫn qua: 2 instance, cạnh tranh render, restart Redis, 100 request đồng thời, Redis chết.
    `@solar/cache` 22/22, 0 skip, 3 lượt với `REDIS_RESTART_CMD="docker restart solar-local-redis"`; `apps/web` `redis.int` 2/2.
  - [x] Bỏ dòng `production.spec.ts:37` khỏi "Test flaky đã biết" trong `tooling/visual/README.md`.
- Phụ thuộc: S03, E5-S06 · Agent: Claude (sandbox Codex không chạy được Playwright/Docker) · Cỡ: M
