# Checklist case biên theo loại story

Dùng ở 3 chỗ: plan (bảng "Case biên & bất biến"), người viết tự review trước khi push (bước 4.5 `/run-story`), reviewer
(đối chiếu "Chưa cover"). Chỉ giữ dòng áp dụng cho story; dòng không áp dụng ghi lý do một câu.

## Chung (mọi story)
- Input rỗng / thiếu / quá dài / sai kiểu; giá trị biên (0, âm, max, chuỗi có `\`, `"`, `|`, xuống dòng, emoji).
- Lỗi bất đồng bộ: reject, timeout, trả chậm sau khi component unmount hoặc dữ liệu đã đổi chỗ.
- Hồi quy: `codegraph impact <symbol>` cho mọi symbol công khai đã sửa → nơi gọi còn đúng không, có test không.
- Thông báo người dùng tiếng Việt (kể cả message tùy biến trong schema), không lộ lỗi nội bộ.
- Không thêm dependency runtime ngoài danh sách đã duyệt; dev dependency ghi lý do.

## UI / component (React)
- Controlled component: parent thay `value` từ ngoài (tải bản khác, hoàn tác) → UI đồng bộ; phản hồi của chính thao tác
  đang gõ không làm mất draft. State cục bộ (draft) không được ghi đè dữ liệu mới.
- Draft sai kiểu: không ghi vào dữ liệu, khóa lưu, vẫn khóa khi phần tử đổi chỉ mục (xóa/sắp xếp mảng).
- SSR → hydrate: không lệch id/aria (dùng `useId`, không bộ đếm module); render server hai lần rồi hydrate không cảnh báo.
- Tắt JavaScript: nội dung vẫn đọc được (không ẩn sau trạng thái chỉ có ở client).
- `prefers-reduced-motion`: tắt cả transition inline của thư viện (dnd-kit…), không chỉ class CSS.
- A11y: axe WCAG A/AA sạch; không lồng control trong `<summary>`/`<a>`/`<button>`; `aria-describedby` cho lỗi; role đúng
  pattern (tab cần panel + phím mũi tên, không thì dùng `aria-pressed`); bàn phím làm được mọi thao tác chuột; thông báo
  live region tiếng Việt.
- Responsive 390/1440: không tràn ngang (`<fieldset>` cần `min-w-0`), vùng chạm ≥ 44px, thao tác chạm có thay thế cho kéo.
- Thao tác phá dữ liệu (xóa, đổi loại, bỏ nhóm) có xác nhận hoặc hoàn tác.
- Token: không màu/font/bo góc viết cứng; đổi theme tự đổi giao diện.
- Trang công khai (`apps/web`): checklist "AI tells" của `design-taste-frontend` (references/tells.md).

## Logic / dữ liệu
- Round-trip: dữ liệu vào → xử lý không chỉnh → ra bằng đúng dữ liệu vào (deep equal), kể cả trường tùy chọn vắng mặt.
- Đổi schema → migration + `schemaVersion`; dữ liệu cũ vẫn đọc được.
- Khóa trùng / thứ tự khóa object (khóa số được JS đưa lên đầu) / mảng rỗng / bản ghi bị xóa giữa chừng.
- Định dạng serialize tự chế: mọi ký tự đặc biệt mã hóa hai chiều (ưu tiên JSON thay vì escape tay).

## Tenant / auth / entitlement
- Tenant khác, phiên realm khác (site ↔ platform), vai trò `client`, cookie chép sang host khác.
- Kiểm quyền trước khi đọc dữ liệu (gate trước, rồi mới query); entitlement kiểm cả server lẫn API.
- Cache tag có tiền tố tenant; trang cache không đọc cookie/phiên.

## Bằng chứng e2e
- Spec nằm trong `tooling/visual` (config phù hợp), không script tạm trong `.agent-runs`.
- Test lỗi khi chạy cả bộ: so với danh sách flaky đã biết (`tooling/visual/README.md`); test mới lỗi → chạy lại trên base
  (`VISUAL_WEB_ROOT`) trước khi kết luận flaky. Ghi đúng tên test và dòng.
- Test mới tự đủ dữ liệu: không giả định tenant fixture có sẵn bản ghi; tạo qua chính luồng đang test hoặc fixture. Chờ
  trạng thái trước khi chuyển trang (đăng nhập xong mới `goto`); locator khớp accessible name thật (`Sửa <tiêu đề>`).
- Test mới đã chạy xanh ở local (`-g '<tên test>'`, có log trong report) trước push — không lấy CI làm lần chạy đầu.
