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

Preset Pro `t07` giữ thứ tự `SolarHomePage` của `template-7`, gồm cả mô hình đầu tư,
bảo hành, chính sách và phản hồi trong `SolarInvestmentDetails`. Bốn variant t07
dùng theme Inter xanh dương/vàng/be với density `screen`; calculator dùng t12.
Dự án/phản hồi có `items` inline để `/lab/presets/t07` render đầy đủ khi chưa có collection.
`note` ghi rõ các khối dùng variant gần nhất. Ảnh after và theme swap nằm ở
`roadmap/evidence/E4/t07/`; chạy kiểm tra runtime bằng
`pnpm --filter @solar/visual exec playwright test -c playwright.t07.config.ts` (cổng 3007).
