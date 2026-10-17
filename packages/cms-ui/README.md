# @solar/cms-ui

Thành phần CMS dùng chung cho `apps/admin`, `apps/console` và wizard tạo site (E13).

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
