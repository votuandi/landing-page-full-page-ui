# @solar/plans

Nguồn quyền sản phẩm duy nhất là `plans.ts`: ba gói Cơ bản / Nâng cao / Cao cấp, nhóm theme,
33 feature và bốn limits. Dữ liệu public bất biến; `getPlan` trả undefined với id lạ,
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
trong `@solar/db`. `changes` nhận `planId`, `addons`, `featureOverrides`, `limitOverrides`, `permissionPolicy` (JSON object),
`planExpiresAt` (`Date | null`), `status` (`active | suspended`);
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
adapter nhận khóa idempotency để xử lý retry an toàn.

## Video tự host (E8-S04)

`videoUpload` thuộc gói Cao cấp (cũng theo trial, addon, override và kill switch chung).
Admin kiểm quyền trước đặt chỗ/presign; server render cũng kiểm quyền khi đổi Media UUID thành URL public.
Mỗi video tối đa **200 MB, 10 phút**, lưu nguyên file và sinh poster AVIF/WebP; chưa có transcode/HLS.
Băng thông phát video tính vào **CDN/VPS của nền tảng**, không phải hạn mức `mediaGb` (dung lượng lưu trữ).
Chưa đo/giới hạn băng thông riêng từng tenant; nên nhúng YouTube/TikTok hoặc dùng Bunny Stream cho adaptive streaming.

## Thanh toán thủ công (E6-S05)

Giai đoạn đầu xuất hóa đơn thủ công. Super admin đã xác thực gán gói/ngày hết hạn qua `changePlan` ở trên;
màn hình console thuộc E15-S03. `planExpiresAt = null` nghĩa là không có hạn thanh toán, cron không nhắc/khóa;
trial không có ngày này vẫn theo `TRIAL_DAYS` của entitlement, không bị billing tự khóa.

Worker gọi `forPlatform(platformDb).billing.run({ now })` lúc khởi động rồi mỗi giờ sau khi lượt trước hoàn tất.
Tenant `active | trial` còn hạn nhận nhắc trước 14/7/1 ngày: mỗi lượt chỉ chọn mốc nhỏ nhất bao phủ số ngày còn lại
(gán khi còn 5 ngày chỉ nhắc mốc 7, không gửi bù mốc 14). Outbox `notify.renewal` mang `{ tenantId, days, expiresAt }`,
khóa `renewal:<tenantId>:<expiresAt ISO>:<days>` nên chạy lặp/nhiều worker không sinh trùng. Audit system
`tenant.renewal.reminded` đi cùng job. Đồng hồ dùng UTC và khoảng thời gian 24 giờ, không theo ngày lịch địa phương.

Tại thời điểm `planExpiresAt + 7 ngày <= now`, cron chuyển tenant sang `suspended`, ghi audit system
`tenant.suspend.expired`, invalidate `tenant:<id>` và mọi `Domain.hostname`, enqueue `notify.suspended`
với khóa `suspended:<tenantId>:<expiresAt ISO>`, tất cả trong một transaction. Proxy hiện có trả 403
"Website tạm ngừng hoạt động." sau khi host cache được invalidate; nội dung vẫn giữ nguyên.
Cron chạy mỗi giờ nên việc chuyển trạng thái xảy ra ở lượt quét đầu sau ngưỡng, không sớm hơn ngưỡng.

Gia hạn bằng ngày mới trong tương lai tự chuyển `suspended → active` khi audit khóa gần nhất là do billing;
khóa thủ công vẫn cần `status: "active"` rõ ràng. `status` chỉ định trong request luôn được ưu tiên.
Đổi status kèm invalidate cả host cache; audit trước/sau lưu ngày ISO. Cron và thao tác console cùng khóa dòng tenant
để không khóa nhầm gói vừa gia hạn. Ngày hết hạn mới có bộ khóa nhắc riêng.

Email/Telegram thật thuộc E11-S02 (adapter hiện chỉ log metadata owner). Cổng PayOS/VNPay ở backlog;
không thu tiền tự động trong giai đoạn này.
