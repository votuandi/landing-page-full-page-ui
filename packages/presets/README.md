# @solar/presets

Preset = theme + section theo thứ tự + widget toàn site. Nội dung mẫu t15 lấy từ cấu hình và collection của app cũ,
có nhãn `[DỮ LIỆU MẪU]`. Không phụ thuộc `apps/web`, không gọi DB.

```ts
import { presets, getPreset, loadPreset, presetSchema } from "@solar/presets";

getPreset("t15"); // Preset | undefined
const { preset, theme, page, widgets } = loadPreset("t15");
// page: PageConfig, theme: ThemeTokens, widgets: SiteWidgetsConfig
// id không tồn tại → throw; tham chiếu không tồn tại → lỗi validation, không fallback.
```

Mỗi file `<id>.json` có `id`, `name`, `group` (`signature | pro | classic`), `themeId`, `source.branch`,
`sections`, `widgets`; `description`, `subpages`, `pages` tùy chọn. Section dùng chung `pageSectionSchema`:
`id`, `type`, `variant`, `enabled`, `anchor`, `data`. Thiếu `data` → defaults của type; có `data` → parse toàn bộ
qua schema của type, không merge từng field vào defaults. Widget thiếu `data` cũng dùng defaults.

`note` giải thích việc dùng variant gần nhất khi section gốc chưa có variant phù hợp. Đây là ghi chú biên tập,
không phải dữ liệu UI; `loadPreset` bỏ nó khỏi `page`. Giữ section tắt trong preset để đổi variant/theme không mất nội dung.

Thêm preset (E4-S02–S10):

1. Đăng ký theme và variant trong package tương ứng.
2. Tạo `<id>.json`, ghi đúng branch gốc trong `source.branch`, dùng ID/anchor duy nhất. Nội dung VI/EN dùng schema chung.
3. Import JSON và thêm `presetSchema.parse(json)` vào `presets` ở `src/index.ts`.
4. Chạy `pnpm --filter @solar/presets test`: test tự quét mọi preset JSON, kiểm registry, schema dữ liệu, widget,
   theme, ID/anchor và việc đăng ký file mới. Không chấp nhận fallback kể cả section/widget tắt.
5. Mở `/lab/presets/<id>` và `?theme=t15`, chụp ảnh bằng `tooling/visual/template-compare.mjs`.

Cấu trúc site (E5-S11, D21): `PAGE_TYPES` là danh mục trang (`home`, `about`, `services`, `projects`, `products`, `news`,
`guides`, `contact`, `policy` — slug, trang bắt buộc, entitlement, section mặc định). `pages` của preset liệt kê loại trang
site tạo từ preset có (thiếu = mọi loại; trang bắt buộc luôn có). `applyPlanToPreset(preset, can)` bỏ trang/section ngoài
gói khi tạo site; `validateSiteStructure({ pageTypes, pages }, can)` trả lỗi tiếng Việt, dùng chung cho wizard, CMS,
builder và API. `can(feature)` là quyền của site (gói + addons).

E6-S04: `validateSiteStructure(structure, { can, pagesLimit, baseline })` dùng bản đã xuất bản làm baseline trong CMS.
Sau hạ gói, section `lockedByPlan` được suy ra từ entitlement: giữ nguyên `id/type/variant/enabled` trên cùng trang
hoặc xóa được; thêm mới, chuyển trang, bật lại hay sửa bị từ chối. Nội dung SectionContent được giữ riêng.
Trang/landing ngoài gói đã có được giữ; vượt giới hạn số trang chỉ bị từ chối khi tăng so với baseline.
Quyền sắp xếp/đổi variant và kiểm tra dữ liệu hợp lệ vẫn áp dụng. Wizard dùng cấu trúc preset đã lọc theo gói làm baseline.

API public trên giữ nguyên cho các story port chạy song song. `subpages` mô tả route demo `/lab` theo slug branch gốc; việc phục vụ tenant,
entitlement và route theo DB triển khai ở các epic sau.

Preset Pro `t07` giữ thứ tự `SolarHomePage` của `template-7`, gồm cả mô hình đầu tư,
bảo hành, chính sách và phản hồi trong `SolarInvestmentDetails`. Bốn variant t07
dùng theme Inter xanh dương/vàng/be với density `screen`; calculator dùng t12.
Dự án/phản hồi có `items` inline để `/lab/presets/t07` render đầy đủ khi chưa có collection.
`note` ghi rõ các khối dùng variant gần nhất. Ảnh after và theme swap nằm ở
`roadmap/evidence/E4/t07/`; chạy kiểm tra runtime bằng
`pnpm --filter @solar/visual exec playwright test -c playwright.t07.config.ts` (cổng 3007).

E4-S09 thêm `t05`, `t06`, `t09` thuộc nhóm Pro, cùng bộ variant C&I. Thứ tự section bật theo trang gốc;
khối tùy chọn không có trên trang gốc được tắt và ghi `note`. Test tỷ lệ giao/hợp đếm `type/variant` của toàn bộ
section đã cấu hình, gồm khối tùy chọn. Projects/testimonials có dữ liệu collection trong JSON để hiện ở lab.
Xem `/lab/presets/t05|t06|t09`, đổi theme bằng `?theme=t15`.

App dev cổng 3005: `pnpm --filter @solar/visual exec playwright test -c playwright.ci-presets.config.ts` kiểm
390/1440, theme gốc/t15, không JavaScript và matrix; lưu JPEG ở `roadmap/evidence/E4/<id>/`.

E4-S10 thêm `t01`–`t04` (Classic) và `BASIC_SECTION_TYPES`, lấy đúng cột gói Cơ bản tại
`roadmap/01-template-analysis.md` §3. Hằng này là bảng tạm, E6 thay bằng `@solar/plans`; `lead-form` chỉ thuộc Cơ bản
khi là liên hệ đơn giản. Classic dùng CTA điện thoại, giữ form lead nâng cao, catalog, calculator, packages, stats,
FAQ và testimonials ở trạng thái tắt. Các khối tắt vẫn giữ dữ liệu và vị trí gốc để nâng gói sau này.

Collection dùng trong lab có `data.items` trực tiếp trong JSON. `?theme=t15` kiểm khả năng đổi theme;
`/lab/presets/t03?subpage=gioi-thieu` và `?subpage=dich-vu` xem `page-hero/t03` với header/footer preset.
Query trang con phải có trong `subpages`, giá trị khác trả 404; không thay route tenant công khai.
