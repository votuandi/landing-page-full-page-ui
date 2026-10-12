# @solar/plans

Nguồn quyền sản phẩm duy nhất là `plans.ts`: ba gói Cơ bản / Nâng cao / Cao cấp, nhóm theme,
30 feature và bốn limits. Dữ liệu public bất biến; `getPlan` trả undefined với id lạ,
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

E6-S02 cung cấp `can`, `limit`, `assertCan` phía server từ Tenant DTO
`{ tenantId, planId, addons, status, createdAt }`, kiểm tên hợp lệ, prerequisite và status/trial.
Trial dùng premium 14 ngày từ createdAt; suspended luôn deny. DB Plan là bản đồng bộ,
không phải quyền override bằng SQL. S01 chưa có các guards này. Không tra `.features.has()` từ web
để thay `can` và bỏ qua addons/status/trial/dependencies.

E5-S04 nối `can` vào section/widget trước tải chunk/collection, catalog/blog routes và metadata,
provider/nút giỏ, CTA chức năng đích và API lead tenant. API phải đối chiếu source đã đăng ký với
form/section published của chính Site và kiểm payload: items cần quoteCart, estimate cần calculator,
trường đại lý cần dealer kể cả source contact. Source/tenant/quyền do client gửi không cấp quyền.
Dữ liệu ngoài gói giữ nguyên khi hạ gói; E6-S03 cập nhật plan/addons và revalidate.

Đồng bộ DB trong deploy bằng `pnpm --filter @solar/db plans:sync`, không seed tenant khách.
