# E12 — Builder kéo-thả (gói Cao cấp)

**Mục tiêu**: khách gói Cao cấp tự thiết kế trang bằng cách kéo thả section từ thư viện, chọn variant, sửa nội dung ngay
trên trang xem trước; tạo nhiều landing page.
**Target epic**: khách dựng một landing page mới từ thư viện section trong ≤ 15 phút không cần hỗ trợ; mọi trang tạo ra vẫn
tuân theo token theme (không thể phá vỡ thiết kế); bundle builder không ảnh hưởng `apps/web`.
**Phụ thuộc**: E3 đủ 28 type, E7-S03…S05, E6.
**Phạm vi**: thao tác ở mức section/variant/props và một số tùy chọn bố cục có giới hạn (khoảng cách, nền xen kẽ, căn chỉnh).
**Ngoài phạm vi**: kéo thả tự do từng pixel, CSS tùy ý, viết HTML.

---

### E12-S01 · Spike: Puck vs dnd-kit tự xây
**Là** chủ dự án, **tôi muốn** chọn nền tảng builder dựa trên bằng chứng, **để** không tốn công làm lại.
- **Chi tiết**: cả hai agent làm độc lập 3 ngày (skill `solar-agent-collab` — "spike"): dựng builder tối thiểu cho 5 type
  (hero, calculator, projects, faq, cta-banner) với: kéo từ thư viện, sắp xếp, đổi variant, sửa props bằng form từ zod,
  preview đúng theme, lưu JSON vào `Page.draftSections`.
  Tiêu chí: tương thích schema zod + `SchemaForm`, kích thước bundle admin, truy cập bàn phím, undo/redo, khóa theo
  entitlement, giấy phép (Puck MIT), độ phức tạp bảo trì.
- **Target**: biên bản so sánh có số đo, cập nhật `02-decisions.md` D10.
- **AC**: [ ] Hai bản demo chạy được · [ ] Quyết định được chủ dự án duyệt.
- Agent: Claude + Codex (song song) · Cỡ: M

### E12-S02 · Canvas preview trong iframe
- **Chi tiết**: iframe tải `apps/web` ở chế độ builder (draft mode + `?builder=1`) trên `<slug>.preview.<platform>` (E5-S07); giao tiếp `postMessage` có
  kiểm origin: chọn section (viền + nhãn), kéo để sắp xếp, cuộn đồng bộ; hiển thị 3 khung thiết bị (390/768/1440).
- **AC**: [ ] Click section trong canvas mở form của đúng section · [ ] Thông điệp từ origin lạ bị bỏ qua.
- Phụ thuộc: S01 · Agent: Claude · Cỡ: L

### E12-S03 · Thư viện section kéo vào trang
- **Chi tiết**: bảng bên trái nhóm theo mục đích (Mở đầu, Thuyết phục, Chuyển đổi, Nội dung, Chân trang); mỗi mục có
  thumbnail theo theme hiện tại và các variant; kéo vào canvas tại vị trí thả; mục ngoài gói có khóa; kiểm `maxPerPage`.
- **AC**: [ ] Thêm calculator thứ hai bị chặn kèm giải thích · [ ] Thumbnail sinh tự động trong CI (E3-S10).
- Phụ thuộc: S02 · Agent: Claude · Cỡ: M

### E12-S04 · Sửa nội dung trực tiếp (inline) cho văn bản
- **Chi tiết**: trường `localized` ngắn (tiêu đề, nút) sửa trực tiếp trên canvas (contentEditable có kiểm soát, chỉ text);
  trường phức tạp mở bảng thuộc tính (SchemaForm).
- **AC**: [ ] Dán văn bản có định dạng → chỉ giữ text · [ ] Giá trị vẫn qua validate zod trước khi lưu.
- Phụ thuộc: S02 · Agent: Claude · Cỡ: M

### E12-S05 · Tùy chọn bố cục có giới hạn
- **Chi tiết**: mỗi instance section có `layout`: `background` (`default|tint|sky|sun|deep|invert`), `spacing`
  (`compact|normal|loose`), `align` (nếu variant hỗ trợ), `anchorId`, `hideOn` (`mobile|desktop`). Chỉ ánh xạ sang token/class
  có sẵn.
- **AC**: [ ] Không tùy chọn nào sinh màu ngoài token (kiểm bằng `lint:tokens` trên HTML render) · [ ] Variant khai báo tùy chọn
  nó hỗ trợ; tùy chọn không hỗ trợ bị ẩn.
- Phụ thuộc: S03 · Agent: Codex · Cỡ: S

### E12-S06 · Lịch sử, undo/redo, phiên bản
- **Chi tiết**: undo/redo trong phiên (≥ 50 bước); mỗi lần "Xuất bản" lưu một `PageVersion`; khôi phục phiên bản cũ; hai
  người sửa cùng trang → khóa mềm + cảnh báo.
- **AC**: [ ] Khôi phục phiên bản 3 lần trước tái tạo đúng trang · [ ] Không mất dữ liệu khi 2 tab cùng lưu (phát hiện xung đột).
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E12-S07 · Nhiều landing page & mẫu trang
**Là** tenant gói Cao cấp, **tôi muốn** tạo landing page riêng cho từng chiến dịch (vd. "Điện mặt trời cho trang trại"), **để** chạy quảng cáo hiệu quả.
- **Chi tiết**: tạo trang `kind=landing` với slug, SEO riêng, chọn ẩn header/footer; bắt đầu từ trang trắng, nhân bản trang có
  sẵn hoặc "mẫu trang" (preset con: landing hộ gia đình, landing nhà xưởng, trang tuyển đại lý); giới hạn số trang theo gói.
  Tùy chọn A/B cho tiêu đề hero/CTA (feature `abTest`, đo theo lead).
- **AC**: [ ] Landing mới truy cập được ở `/<slug>`, có trong sitemap · [ ] Vượt `limits.pages` bị chặn.
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M
