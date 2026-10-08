# E10 — Triển khai VPS & AWS, vận hành

**Mục tiêu**: cùng một bộ image Docker chạy được trên VPS (docker compose + Caddy) và AWS; đổi môi trường bằng biến,
không sửa code.
**Target epic**: dựng môi trường VPS mới từ đầu ≤ 30 phút bằng script; deploy không gián đoạn (zero-downtime);
RPO ≤ 24 h, RTO ≤ 2 h; uptime site ≥ 99,9%/tháng.
**Phụ thuộc**: E1. Chạy song song với E5.

---

### E10-S01 · Image Docker cho `web` và `admin`
**Là** dev vận hành, **tôi muốn** image nhỏ, build một lần chạy mọi nơi, **để** deploy nhanh và nhất quán.
- **Chi tiết**: Dockerfile đa giai đoạn dùng `turbo prune --docker` + Next `output: "standalone"`; Prisma client gộp
  vào image; user không root; healthcheck `/api/health` (kiểm DB, Redis). Thay Dockerfile cũ (đang tham chiếu prisma
  của develop). Tag image theo commit SHA, đẩy lên GHCR (và ECR cho AWS).
- **Target**: image `web` ≤ 250 MB; khởi động ≤ 5 s.
- **AC**: [ ] CI build và đẩy image khi merge · [ ] Container chạy với `read_only: true` (trừ thư mục tạm/khi dùng storage local).
- Agent: Codex · Cỡ: M

### E10-S02 · Môi trường VPS: compose + Caddy
**Là** chủ dự án, **tôi muốn** chạy toàn bộ nền tảng trên một VPS giá rẻ, **để** chi phí thấp giai đoạn đầu.
- **Chi tiết**: `infra/vps/docker-compose.yml`: `caddy` (on-demand TLS, phục vụ media local qua `file_server` tại
  `media.<platform>`), `web` ×2 bản sao, `admin`, `worker` (xử lý ảnh, job DNS, cron), `postgres:16`, `redis:7`.
  Script `infra/vps/bootstrap.sh` (Ubuntu 24.04: Docker, firewall chỉ mở 22/80/443, fail2ban, swap, unattended-upgrades).
  Deploy: `deploy.sh <sha>` kéo image, chạy migration, rolling restart từng bản `web` (Caddy health-check `lb_policy`).
- **Target**: VPS 4 vCPU/8 GB phục vụ ≥ 200 tenant ở mức traffic SME.
- **AC**:
  - [ ] Từ VPS trắng → site demo HTTPS chạy trong ≤ 30 phút làm theo README.
  - [ ] Deploy phiên bản mới: không có request lỗi 5xx (đo bằng k6 trong lúc deploy).
- Phụ thuộc: S01, E9-S02 · Agent: Codex · Cỡ: L

### E10-S03 · Cache ISR dùng chung (Redis)
**Là** chủ dự án, **tôi muốn** mọi bản `web` thấy cùng một cache, **để** khách lưu nội dung là mọi người thấy bản mới.
- **Chi tiết**: cài hợp đồng `packages/cache` của E5-S05 bằng Redis, gồm cả `cacheHandler` (ISR/route) và `cacheHandlers`
  (`"use cache"`, Next 16) — hai API có hợp đồng khác nhau, viết hai adapter. Chống dữ liệu cũ do cạnh tranh:
  - Mỗi tag có **dấu thời gian vô hiệu hóa bền vững** trong Redis (`tag:<t>:invalidatedAt`); entry cache lưu thời điểm bắt đầu
    render; khi đọc, entry bắt đầu trước `invalidatedAt` của bất kỳ tag nào → coi như hết hạn. Nhờ vậy render đang chạy dở
    ghi lại bản cũ cũng không được phục vụ.
  - Pub/sub chỉ để xóa cache bộ nhớ cục bộ nhanh; mất kết nối → khi kết nối lại, xóa toàn bộ cache cục bộ (không tin pub/sub).
  - Chống dồn render (stampede): khóa ngắn `SET NX` theo key, instance khác phục vụ bản cũ hợp lệ trong lúc chờ.
  - Không có `REDIS_URL` → cache bộ nhớ (dev).
- **AC**:
  - [ ] Test: 2 instance, revalidate qua instance A → instance B trả bản mới ở request kế tiếp.
  - [ ] Test cạnh tranh: render chậm bắt đầu trước invalidation, ghi xong sau → không được phục vụ.
  - [ ] Restart Redis / ngắt pub/sub giữa chừng → không instance nào phục vụ bản đã bị vô hiệu hóa.
  - [ ] 100 request đồng thời vào key hết hạn → 1 lần render.
  - [ ] Redis chết → site vẫn phục vụ (fallback render, cảnh báo), không 500.
- Phụ thuộc: E5-S05 (hợp đồng) · Agent: Claude (review Codex adversarial) · Cỡ: L

### E10-S04 · Môi trường AWS
**Là** chủ dự án, **tôi muốn** chạy được trên AWS khi khách lớn yêu cầu, **để** mở rộng và đáp ứng hợp đồng doanh nghiệp.
- **Chi tiết**: IaC (AWS CDK TypeScript, cùng ngôn ngữ với repo) trong `infra/aws`: VPC, ECS Fargate (`web` autoscale 2–10,
  `admin`, `worker`), ALB, RDS Postgres (Multi-AZ tùy chọn), ElastiCache Redis, S3 (media) + CloudFront, Secrets Manager,
  CloudWatch. Tên miền khách đi qua **Cloudflare for SaaS** (E9-S03) → ALB (ALB không hỗ trợ on-demand TLS).
  Tùy chọn rẻ hơn: Lightsail/EC2 + chính bộ compose của VPS.
- **AC**:
  - [ ] `cdk deploy` dựng môi trường staging từ đầu.
  - [ ] Cùng image Docker với VPS; khác nhau chỉ ở biến môi trường.
  - [ ] Ước tính chi phí hàng tháng ghi trong `infra/aws/README.md`.
- Phụ thuộc: S01, S03, E8-S01, E9-S03 · Agent: Codex · Cỡ: L

### E10-S05 · Cấu hình & bí mật
- **Chi tiết**: `packages/env` kiểm biến môi trường bằng zod lúc khởi động (thiếu → không start, thông báo rõ); bí mật tích hợp
  của tenant (token Telegram, webhook) mã hóa AES-GCM bằng khóa `APP_ENCRYPTION_KEY` (hỗ trợ xoay khóa). `.env.example` đầy đủ.
- **AC**: [ ] Thiếu `DATABASE_URL` → container dừng với thông báo · [ ] Không bí mật nào nằm trong log.
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
