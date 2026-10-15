# @solar/plans

Nguồn quyền sản phẩm duy nhất là `plans.ts`: ba gói Cơ bản / Nâng cao / Cao cấp, nhóm theme,
31 feature và bốn limits. Dữ liệu public bất biến; `getPlan` trả undefined với id lạ,
`isPlanId` / `isFeature` kiểm tên cả ở biên DB. Package không phụ thuộc DB, React, Next hoặc sections.

```sh
pnpm --filter @solar/plans typecheck
pnpm --filter @solar/plans lint
pnpm --filter @solar/plans test
pnpm plans:table
pnpm plans:table --check
```

Bảng bán hàng ở `roadmap/README.md` §4 được sinh giữa markers từ cùng định nghĩa; CI luôn kiểm
trên Windows/Linux ngoài Turbo cache/filter. `--check` không ghi README, trả exit 1 khi lệch hoặc marker lỗi.
Các feature tương lai là quyền sản phẩm, không xác nhận chức năng đã triển khai. Chưa khai giá tiền.

`leadForm` là form liên hệ/tư vấn Cơ bản (`contact` / `popup`); `quoteForm` là form nhận báo giá
Nâng cao (section `lead-form`, nguồn `home-bottom`). Calculator / `story-cta` dùng `calculator`;
form đại lý dùng `dealer`; giỏ và nguồn `quote-cart` dùng `quoteCart`.
Catalog và giỏ là hai quyền độc lập: `featureDependencies.quoteCart = ["catalog"]` yêu cầu catalog,
không tự cấp nó. Tenant.addons chứa tên Feature; Pro mua giỏ phải có cả catalog + quoteCart.
Addon không đổi limits hoặc mở nhóm theme. Theme group đối chiếu `theme.meta.group`.

Limits áp dụng theo tenant, không nhân theo số Site. `pages` tính home + landing CMS do khách tạo;
trang hệ thống, liên hệ/chính sách, danh mục và từng detail Product/Post không tiêu hạn mức này.

## Entitlements (E6-S02, `entitlements.ts`)

`can(site, feature, { disabled, now })` phân giải theo D19:
1. feature lạ hoặc tenant `suspended` → `false`; feature nằm trong kill switch `PlatformSetting["features.disabled"]` → `false`;
2. `Tenant.featureOverrides[feature] = { on, until?, reason }` hợp lệ, chưa hết hạn → `on`;
3. gói ∪ `addons` ∪ trial (`status = trial`, trong `TRIAL_DAYS = 14` ngày từ `Tenant.createdAt` → mọi feature Cao cấp).
Prerequisite (`featureDependencies`) cũng phải qua `can`. Mục override sai schema bị bỏ qua từng mục, không mở khóa gì.

`limit(site, key)` = giới hạn gói + `Tenant.limitOverrides[key].add` còn hạn. `assertCan` ném `EntitlementError` 403;
`assertWithinLimit(site, key, used, adding)` ném 413 với `mediaGb` (tính theo byte) và 403 với limit khác — thông báo tiếng Việt.
Zod: `featureOverridesSchema`, `limitOverridesSchema` (UI chỉnh ở E15-S05/S06), `disabledFeaturesSchema`.
Web đọc kill switch qua hàm SECURITY DEFINER `platform_disabled_features()` (`loadDisabledFeatures` trong `@solar/db`).
Trang tenant mang thêm tag `ENTITLEMENTS_TAG = "platform:entitlements"` khi bật cache (E5-S06).
Điểm vào phải kiểm: danh sách trong `apps/web/src/lib/tenant/__tests__/entitlements.test.ts`.

API lead tenant (`createTenantLeadHandler`, `apps/web/src/lib/tenant/leadIntake.ts`) kiểm `source` và payload; nguồn lạ tính là `leadForm`:

| `source` / payload | Feature |
|---|---|
| `contact`, `popup` | `leadForm` |
| `home-bottom` | `quoteForm` |
| `calculator`, `hero-bill`, `story-cta` (nút ở Shorts mở máy tính chi phí), `estimate` | `calculator` |
| `dealer`, `businessType` | `dealer` |
| `quote-cart`, `items` | `quoteCart` |

E5-S04 nối `can` vào section/widget trước tải chunk/collection, catalog/blog routes và metadata,
provider/nút giỏ, CTA chức năng đích và API lead tenant. API phải đối chiếu source đã đăng ký với
form/section published của chính Site và kiểm payload: items cần quoteCart, estimate cần calculator,
trường đại lý cần dealer kể cả source contact. Source/tenant/quyền do client gửi không cấp quyền.
Đối chiếu source với form published của Site làm cùng việc lưu lead tenant (E11).
Dữ liệu ngoài gói giữ nguyên khi hạ gói; E6-S03 cập nhật plan/addons và revalidate.

Đồng bộ DB trong deploy bằng `pnpm --filter @solar/db plans:sync`, không seed tenant khách.

## Đổi gói (E6-S03)

Console đã xác thực PlatformAdmin gọi `forPlatform(platformDb).tenants.changePlan({ actorId, tenantId, changes, reason? })`
trong `@solar/db`. `changes` nhận `planId`, `addons`, `featureOverrides`, `limitOverrides`, `permissionPolicy` (JSON object);
trường lạ bị từ chối. Caller kiểm quyền và lấy `actorId` từ phiên đã xác thực, không lấy từ client. Runtime DB không có API này.

Hàm khóa tenant, chỉ cập nhật trường thực sự đổi, ghi `AuditLog` `tenant.plan.change` (actor, trước/sau, lý do) và outbox
invalidate `tenant:<id>` trong cùng transaction. Lỗi bất kỳ bước nào rollback toàn bộ; không đổi gì trả `{ changed: false }`
và không tạo audit/job. Hạ gói giữ nguyên cấu hình/nội dung site; nâng lại gói khôi phục quyền tương ứng.
Khi `planId` đổi, thêm `notify.plan-changed` với khóa `notify.plan-changed:<auditId>`.

Worker poll mỗi giây, gửi invalidation có chữ ký đến web để lượt đọc sau lấy gói mới. Mục tiêu đổi gói có hiệu lực ≤60 giây
khi worker/web hoạt động bình thường và mọi replica có trong `WEB_REVALIDATE_URLS`; khi web ngắt, job vẫn bền vững và retry
theo backoff (không bảo đảm 60 giây lúc gián đoạn).

Worker quét override khi khởi động rồi mỗi 5 phút sau khi lượt trước hoàn tất. `scanExpiredOverrides({ now })` xét cả feature
và limit có `until` trong `(now - 24 giờ, now]`, chuẩn hóa thời gian UTC và enqueue với khóa `override-expired:<tenantId>:<until>`;
nhiều lần quét/worker không tạo trùng. Audit hệ thống `tenant.override.expired` đi cùng job; dữ liệu override được giữ nguyên.
Cửa sổ 24 giờ bù gián đoạn ngắn; gián đoạn dài hơn cần vận hành invalidate tenant (cache nội dung cũng có TTL 24 giờ).

Notification mặc định tìm owner và ghi metadata `[notify]`, chưa gửi email/Telegram thật. Adapter gửi thật thuộc E11-S02;
adapter nhận khóa idempotency để xử lý retry an toàn. Ngày hết hạn gói/status và billing cron thuộc E6-S05.
