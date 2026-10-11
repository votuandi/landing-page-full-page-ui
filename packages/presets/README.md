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
`sections`, `widgets`; `description`, `subpages` tùy chọn. Section dùng chung `pageSectionSchema`:
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

API public trên giữ nguyên cho các story port chạy song song. `subpages` mô tả route preset bật; việc phục vụ tenant,
entitlement và route theo DB triển khai ở các epic sau.

E4-S10 thêm `t01`–`t04` (Classic) và `BASIC_SECTION_TYPES`, lấy đúng cột gói Cơ bản tại
`roadmap/01-template-analysis.md` §3. Hằng này là bảng tạm, E6 thay bằng `@solar/plans`; `lead-form` chỉ thuộc Cơ bản
khi là liên hệ đơn giản. Classic dùng CTA điện thoại, giữ form lead nâng cao, catalog, calculator, packages, stats,
FAQ và testimonials ở trạng thái tắt. Các khối tắt vẫn giữ dữ liệu và vị trí gốc để nâng gói sau này.

Collection dùng trong lab có `data.items` trực tiếp trong JSON. `?theme=t15` kiểm khả năng đổi theme;
`/lab/presets/t03?subpage=gioi-thieu` và `?subpage=dich-vu` xem `page-hero/t03` với header/footer preset.
Query trang con phải có trong `subpages`, giá trị khác trả 404; không thay route tenant công khai.
