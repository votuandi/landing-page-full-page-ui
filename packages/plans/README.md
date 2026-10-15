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
