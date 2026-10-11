# Quy trình port chung E4 (S02–S10)

Mọi plan port template E4-S02…S10 tham chiếu file này. Plan từng story chỉ ghi phần riêng (theme, variant, thứ tự,
quyết định). Hạ tầng do E4-S01 dựng: `@solar/presets` (`packages/presets`, xem README), `/lab/presets/[id]`
(`?theme=`), `tooling/visual/template-compare.mjs`.

## Bước chung
1. **Theme** (skill `solar-theme-port`): `packages/themes/<id>/theme.ts` (`parseTheme`), thêm vào `themes` trong
   `packages/themes/src/index.ts`. Font chỉ chọn trong `FONTS` có sẵn (Inter, Be Vietnam Pro, Manrope, Plus Jakarta
   Sans, Montserrat); thiếu → thêm vào `scripts/build-fonts.py` + chạy lại sinh `fonts.generated.ts` và file woff2.
   Test AA của `@solar/themes` tự kiểm theme mới; không đạt → sửa token, không sửa component.
2. **Variant** (skill `solar-section-variant`): `packages/sections/src/<type>/<variant>.tsx` (+ `.client.tsx` /
   `.island.tsx` theo mẫu t15 khi cần tương tác), đăng ký trong `<type>/index.ts` (`defineVariants`). Widget:
   `packages/sections/src/widgets/<widget>/<variant>.tsx` + registry widget.
   - Props đúng schema chung của type. Thiếu trường thật sự cần → thêm **tùy chọn** vào schema chung, tăng
     `schemaVersion` + migration nếu đổi nghĩa (AGENTS.md §4). Không thêm trường chỉ một variant dùng mà có thể suy ra.
   - Chỉ token (`pnpm lint:tokens` = 0). Logic nghiệp vụ dùng `@solar/core`; state liên section dùng `useSegment()`,
     `useOpenCalculator()`, calculator bus có sẵn.
   - **Không nhân đôi**: bản gốc gần như giống variant đã có (cùng bố cục, chỉ khác màu/chữ — thường gặp ở t12/t13/t14
     vì t15 gộp từ đó) → không tạo file mới, preset dùng variant có sẵn kèm `note` "giống <type>/<variant>, khác ở theme".
     Ghi danh sách này trong báo cáo mục "Lệch so với plan" với 1 dòng lý do mỗi variant.
3. **Fixture/test**: mọi variant render được với `defaults` của type (test render server hiện có của sections tự lặp
   qua registry — bảo đảm variant mới nằm trong vòng lặp). Variant có logic mới → unit test.
4. **Preset** `packages/presets/<id>.json`: `source.branch` = branch gốc; section theo **đúng thứ tự trang chủ gốc**
   (đọc `src/app/page.tsx` → component home của branch gốc); khối không đủ giá trị → variant gần nhất + `note`.
   `data` chỉ ghi phần khác `defaults` cần để giống bản gốc (tiêu đề, danh sách…), nội dung hư cấu gắn `[DỮ LIỆU MẪU]`.
   Widget theo bản gốc. Test preset của `@solar/presets` phải qua.
5. **Ảnh so sánh**: chạy app (`pnpm dev --filter web`, cổng riêng nếu chạy song song: `-- -p 30NN`), rồi
   `node tooling/visual/template-compare.mjs <id> --app http://localhost:30NN --port 41NN` → `docs/evidence/E4/<id>/`.
   Không chạy được (mạng/cài đặt branch gốc lỗi) → ghi lỗi nguyên văn vào báo cáo, vẫn chụp phần "after".
6. **Kiểm theme khác**: mở `/lab/presets/<id>?theme=t15` và `/lab/sections/matrix` — variant mới hiện đúng ở t15 và theme gốc.
7. **Tài liệu**: cột "Đã port" trong `roadmap/01-template-analysis.md` (chỉ dòng của template mình — tránh sửa dòng khác).

## Chạy song song (worktree)
- Mỗi story một worktree ngoài repo `../lp-e4/<ID>`, branch từ `feat/E4-template-port`. Cổng dev: `3000 + NN`
  (t12 → 3012), cổng branch gốc `4100 + NN`.
- File dùng chung hay đụng nhau: `packages/themes/src/index.ts`, `<type>/index.ts`, registry widget,
  `01-template-analysis.md`, `fonts.generated.ts`. Chỉ **thêm dòng**, không sắp xếp lại/định dạng lại dòng của người khác.
- Không sửa `packages/tokens` trừ khi plan story cho phép (chỉ E4-S08).

## AC chung E4 → bằng chứng (mọi story)
| AC chung | Bằng chứng |
|---|---|
| `theme.ts` parse `ThemeTokens`, AA | `pnpm --filter @solar/themes test` |
| Variant qua `lint:tokens`, fixture chung, đúng ở t15 + theme gốc | `pnpm lint:tokens`, test render sections, ảnh `/lab/presets/<id>` và `?theme=t15` |
| Preset đúng thứ tự gốc, `note` khi thay | `<id>.json` + test `@solar/presets` |
| Ảnh so sánh trước/sau | `docs/evidence/E4/<id>/` |

## Lệnh kiểm tra chung
- `pnpm turbo run typecheck lint test`
- `pnpm lint:tokens`

## Design pass (Claude, sau khi Codex dựng)
Claude so ảnh before/after 390/1440, chỉnh trình bày (khoảng cách, typography, hiệu ứng, tương phản, responsive) của
variant mới; Codex làm theme, schema, variant (cấu trúc + token), preset, test, ảnh.
