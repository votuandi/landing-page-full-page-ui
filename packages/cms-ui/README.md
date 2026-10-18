# @solar/cms-ui

Thành phần CMS dùng chung cho `apps/admin`, `apps/console` và wizard tạo site (E13).

## `<SectionListEditor>`

Controlled component nhận `value` là các descriptor `{ id, type, variant, enabled, anchor? }`, phát `onChange`;
không đọc phiên hay gọi mạng. Truyền `can={{ reorder, variantSwitch }}` từ quyền + gói và `allowedTypes`/`lockedTypes`
đã lọc ở server. Có kéo thả chuột/bàn phím, nút lên/xuống, bật/tắt, đổi variant cùng type, thêm và xác nhận xóa.
Mọi section, kể cả tắt, tính vào `meta.maxPerPage` qua `sectionLimitIssues` của `@solar/sections`.
Caller khóa nút lưu khi helper trả lỗi; server vẫn phải kiểm bằng `validateSiteStructure`.
Thumbnail là ô nhãn variant dùng token; ảnh chụp thật thuộc E7-S13. `newId(type)` có thể tiêm vào cho test/wizard.
Lab `/lab/cms-sections`, test `sectionEditor.test.tsx`, bằng chứng browser `tooling/visual/cms-sections.spec.ts`.

## `<SchemaForm>`

```tsx
<SchemaForm schema={def.schema} value={value} onChange={setValue} onSubmit={save}
  bilingual={can("bilingual")} pickers={{ media, pages, collectionItems }} widgets={{ "tariffs.*": TariffTable }} />
```

- Duyệt zod (`describe`): string, number, boolean, enum/literal, object, record khóa enum, mảng (thêm/xóa/nhân bản,
  kéo sắp xếp bằng dnd-kit, có bàn phím), union (có hoặc không discriminator), optional/default/nullable, và widget
  khai báo bằng `fieldRegistry` của `@solar/sections` (`localized`, `media`, `link`, `richText`, `collectionQuery`).
- Validate inline bằng chính schema, thông báo tiếng Việt (`validate`, `viError`); message riêng trong schema giữ nguyên.
  Ô số sai kiểu không ghi vào dữ liệu và khóa nút lưu.
- Dữ liệu chưa chạm giữ nguyên: submit không chỉnh sửa trả đúng dữ liệu vào (test round-trip cho mọi section type).
- Override: `widgets` theo đường dẫn (số chỉ mục viết `*`) hoặc theo widget/kind; `labels` theo đường dẫn.
- Chưa có thư viện media (E8-S05): không truyền `pickers.media` thì ô media là ô nhập mã/đường dẫn.

Thêm section type mới → có form ngay, không cần code riêng. Test: `pnpm --filter @solar/cms-ui test`.

## Sửa nội dung và xem trước

`useAutosave(value, { save, valid, delay: 800 })` lưu tuần tự, chỉ gửi giá trị mới nhất sau debounce.
Lỗi giữ `dirty`; 409 (`conflict: true`) dừng tự lưu đến khi tải lại. `flush()` thử lưu ngay.
`SchemaForm.onValidityChange` báo cả lỗi nhập thô (ô số chứa chữ) để caller dừng autosave và cảnh báo chưa lưu.
`useLeaveGuard(dirty)` chặn đóng/tải lại trang và hỏi trước link nội bộ; App Router `popstate` chưa hỗ trợ chặn.

`PreviewFrame` dùng protocol từ `@solar/cms-ui/preview/protocol`, xác thực cả origin và cửa sổ iframe,
cuộn khi nhận `ready`, gửi `refresh` khi `refreshKey` tăng. `src` giữ nguyên sau lưu để token một lần và phiên draft
không bị tải lại. Web preview xác thực cửa sổ cha trước `router.refresh()` và tôn trọng reduced motion khi cuộn.
`SectionListEditor.editHref(section)` thêm link sửa nội dung độc lập với quyền đổi bố cục.
