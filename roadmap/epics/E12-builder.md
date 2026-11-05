# E12 — Builder kéo-thả (gói Cao cấp)

**Mục tiêu**: khách gói Cao cấp tự thiết kế trang bằng cách kéo thả section từ thư viện, chọn variant, sửa nội dung ngay
trên trang xem trước; tạo nhiều landing page.
**Target epic**: khách dựng một landing page mới từ thư viện section trong ≤ 15 phút không cần hỗ trợ; mọi trang tạo ra vẫn
tuân theo token theme (không thể phá vỡ thiết kế); bundle builder không ảnh hưởng `apps/web`.
**Phụ thuộc**: E3 đủ 28 type, E7-S03…S05, E6.
**Phạm vi**: thao tác ở mức section/variant/props và một số tùy chọn bố cục có giới hạn (khoảng cách, nền xen kẽ, căn chỉnh).
**Ngoài phạm vi**: kéo thả tự do từng pixel, CSS tùy ý, viết HTML.

---

### E12-S01 · Spike: Puck vs dnd-kit tự xây ✅ [PR #77](https://github.com/votuandi/landing-page-full-page-ui/pull/77)
**Là** chủ dự án, **tôi muốn** chọn nền tảng builder dựa trên bằng chứng, **để** không tốn công làm lại.
- **Chi tiết**: cả hai agent làm độc lập 3 ngày (skill `solar-agent-collab` — "spike"): dựng builder tối thiểu cho 5 type
  (hero, calculator, projects, faq, cta-banner) với: kéo từ thư viện, sắp xếp, đổi variant, sửa props bằng form từ zod,
  preview đúng theme, lưu JSON vào `Page.draftSections`.
  Tiêu chí: tương thích schema zod + `SchemaForm`, kích thước bundle admin, truy cập bàn phím, undo/redo, khóa theo
  entitlement, giấy phép (Puck MIT), độ phức tạp bảo trì.
- **Target**: biên bản so sánh có số đo, cập nhật `02-decisions.md` D10.
- **AC**: [x] Hai bản demo chạy được (`spike/E12-S01-puck`, `spike/E12-S01-dnd-kit`, số đo ở [`spikes/E12-S01.md`](../spikes/E12-S01.md)) · [x] Quyết định được chủ dự án duyệt (02/11/2026: tự xây trên dnd-kit).
- Agent: Claude + Codex (song song) · Cỡ: M

### E12-S02 · Canvas preview trong iframe ✅ [PR #78](https://github.com/votuandi/landing-page-full-page-ui/pull/78)
- **Chi tiết**: iframe tải `apps/web` ở chế độ builder (draft mode + `?builder=1`) trên `<slug>.preview.<platform>` (E5-S07); giao tiếp `postMessage` có
  kiểm origin: chọn section (viền + nhãn), kéo để sắp xếp, cuộn đồng bộ; hiển thị 3 khung thiết bị (390/768/1440).
  Trước khi làm, xử lý các phát hiện của spike ([`spikes/E12-S01.md`](../spikes/E12-S01.md) mục "Việc cho E12-S02 trở đi"): port bản sửa `PreviewBridge`
  (`scrollIntoView` cuộn cả trang admin), token preview dùng một lần, `sectionId` rỗng làm mất lệnh refresh.
- **AC**: [x] Click section trong canvas mở form của đúng section (`builder.spec.ts`) · [x] Thông điệp từ origin lạ bị bỏ qua (unit `previewFrame.test.tsx`, `previewProtocol.test.ts`; e2e bước 5).
- Phụ thuộc: S01 · Agent: Claude · Cỡ: L

### E12-S03 · Thư viện section kéo vào trang ✅ [PR #80](https://github.com/votuandi/landing-page-full-page-ui/pull/80)
- **Chi tiết**: bảng bên trái nhóm theo mục đích (Mở đầu, Thuyết phục, Chuyển đổi, Nội dung, Chân trang); mỗi mục có
  thumbnail theo theme hiện tại và các variant; kéo vào canvas tại vị trí thả; mục ngoài gói có khóa; kiểm `maxPerPage`.
- **AC**: [x] Thêm calculator thứ hai bị chặn kèm giải thích (unit `sectionLibrary.test.ts`, `builderLibrary.test.ts`, server `pageSections.test.ts`; e2e `builder.spec.ts` › "thêm calculator thứ hai bị chặn kèm giải thích") · [x] Thumbnail sinh tự động trong CI (E3-S10; workflow `thumbnails.yml`, [run 41650047496](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/41650047496): 1290 ảnh, artifact `section-thumbs`). PR [#80](https://github.com/votuandi/landing-page-full-page-ui/pull/80).
- Phụ thuộc: S02 · Agent: Claude · Cỡ: M

### E12-S04 · Sửa nội dung trực tiếp (inline) cho văn bản ✅ [PR #82](https://github.com/votuandi/landing-page-full-page-ui/pull/82)
- **Chi tiết**: trường `localized` ngắn (tiêu đề, nút) sửa trực tiếp trên canvas (contentEditable có kiểm soát, chỉ text);
  trường phức tạp mở bảng thuộc tính (SchemaForm).
- **AC**: [x] Dán văn bản có định dạng → chỉ giữ text (unit `builderMode.test.ts` › insertPlain, `builderCanvas.test.ts`; e2e `builder.spec.ts` › "dán văn bản có định dạng chỉ giữ text") · [x] Giá trị vẫn qua validate zod trước khi lưu (unit `inline.test.ts`, `builderLibrary.test.ts`; e2e `builder.spec.ts` › "sửa inline vượt giới hạn không lưu").
- Phụ thuộc: S02 · Agent: Claude · Cỡ: M

### E12-S05 · Tùy chọn bố cục có giới hạn ✅ [PR #83](https://github.com/votuandi/landing-page-full-page-ui/pull/83)
- **Chi tiết**: mỗi instance section có `layout`: `background` (`default|tint|sky|sun|deep|invert`), `spacing`
  (`compact|normal|loose`), `align` (nếu variant hỗ trợ), `anchorId`, `hideOn` (`mobile|desktop`). Chỉ ánh xạ sang token/class
  có sẵn.
- **AC**: [x] Không tùy chọn nào sinh màu ngoài token (kiểm bằng `lint:tokens` trên HTML render) · [x] Variant khai báo tùy chọn
  nó hỗ trợ; tùy chọn không hỗ trợ bị ẩn.
- Bằng chứng local: `packages/sections/src/__tests__/layout.test.tsx` (AC1 ma trận HTML 11 variant opt-in, fallback/ignore),
  `apps/admin/src/__tests__/layoutOptions.test.ts` + `layoutFields.test.ts` (ẩn control theo capability/theme), lint token
  sections/cms-ui/admin 0 vi phạm; e2e `builder.spec.ts` (6 test bố cục). CI regression toàn bộ [run 41859491943](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/41859491943) xanh (attempt 2) + matrix/visual run 41859491694. PR [#83](https://github.com/votuandi/landing-page-full-page-ui/pull/83).
- Phụ thuộc: S03 · Agent: Codex · Cỡ: S

### E12-S06 · Lịch sử, undo/redo, phiên bản ✅ [PR #84](https://github.com/votuandi/landing-page-full-page-ui/pull/84)
- **Chi tiết**: undo/redo trong phiên (≥ 50 bước); mỗi lần "Xuất bản" lưu một `PageVersion`; khôi phục phiên bản cũ; hai
  người sửa cùng trang → khóa mềm + cảnh báo.
- **AC**: [x] Khôi phục phiên bản 3 lần trước tái tạo đúng trang (int `publish.int.test.ts` › "restore phiên bản 3 lần trước tái tạo đúng trang", "restore bản mới nhất là round-trip"; e2e `builder.spec.ts` › "khôi phục phiên bản 3 lần trước rồi xuất bản") · [x] Không mất dữ liệu khi 2 tab cùng lưu (phát hiện xung đột) (int "hai lần lưu cùng revision: lần sau bị chặn"; e2e `builder.spec.ts` › "hai tab cùng lưu: tab sau bị chặn, không ghi đè", kèm cảnh báo khóa mềm). CI [run 41960815725](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/41960815725) xanh. PR [#84](https://github.com/votuandi/landing-page-full-page-ui/pull/84).
- Undo/redo 100 bước trong phiên (unit `builderHistory.test.ts`; e2e "hoàn tác và làm lại thứ tự section", "hoàn tác nội dung trả giá trị cũ"); khóa mềm là cảnh báo trong bộ nhớ tiến trình admin (`editPresence.ts`, README admin).
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E12-S07 · Nhiều landing page & mẫu trang ✅ [PR #85](https://github.com/votuandi/landing-page-full-page-ui/pull/85)
**Là** tenant gói Cao cấp, **tôi muốn** tạo landing page riêng cho từng chiến dịch (vd. "Điện mặt trời cho trang trại"), **để** chạy quảng cáo hiệu quả.
- **Chi tiết**: tạo trang `kind=landing` với slug, SEO riêng, chọn ẩn header/footer; bắt đầu từ trang trắng, nhân bản trang có
  sẵn hoặc "mẫu trang" (preset con: landing hộ gia đình, landing nhà xưởng, trang tuyển đại lý); giới hạn số trang theo gói.
  A/B cho tiêu đề hero/CTA tách sang S08 (05/11/2026).
- **AC**: [x] Landing mới truy cập được ở `/<slug>`, có trong sitemap (e2e `admin.spec.ts` › "landing page: tạo từ mẫu…") · [x] Vượt `limits.pages` bị chặn (int "vượt limit: song song…" + e2e "landing page: vượt giới hạn gói…").
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M

### E12-S08 · A/B tiêu đề hero/CTA
**Là** tenant gói Cao cấp, **tôi muốn** thử hai phiên bản tiêu đề hero/CTA trên landing page, **để** biết phiên bản nào ra nhiều lead hơn.
- **Chi tiết**: bật A/B cho một landing (feature `abTest`, kiểm cả server lẫn API); nhập phiên bản B cho tiêu đề hero và nhãn CTA;
  trang vẫn cache (ISR) nên gán phiên bản ở client, ổn định theo khách truy cập, không đọc cookie ở server; lead ghi phiên bản đã thấy;
  admin xem số lượt xem và lead theo phiên bản, chọn phiên bản thắng. Tắt JS → luôn phiên bản A.
- **AC**: [ ] Khách được gán A/B ổn định, lead ghi phiên bản · [ ] Admin thấy lead theo phiên bản · [ ] Gói không có `abTest` bị chặn ở server.
- Phụ thuộc: S07 · Agent: Codex · Cỡ: M
