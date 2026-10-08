---
name: solar-story-plan
description: Prepare planning input for a roadmap story so Claude spends fewer tokens — either a discovery brief (relevant files, current code, constraints) or a full draft plan in roadmap/plans/<ID>.md for Claude to approve. Use when a prompt says "Dùng skill solar-story-plan" with mode brief or draft.
---

# Chuẩn bị plan cho story

Mục tiêu: bạn làm phần đọc nhiều (khảo sát code, branch template, tài liệu), Claude chỉ đọc kết quả cô đọng. Chỉ đọc
repo, **không sửa code**. File được ghi: đúng file output trong prompt.

Đọc trước: `AGENTS.md`, block story trong file epic (ID trong prompt) + phần đầu epic, `roadmap/02-decisions.md` (ADR liên
quan), `roadmap/plans/README.md` (khung plan). Story port template: đọc nguồn bằng `git show origin/template-NN:<path>` và
bảng ở `roadmap/01-template-analysis.md`.

## Mode `brief` → `.agent-runs/<ID>/brief.md` (≤ 150 dòng)

Dùng khi Claude tự viết plan (story kiến trúc/UI). Chỉ ghi sự thật đã kiểm, không đề xuất thiết kế:

```markdown
# Brief <ID>
## File liên quan
- `path/file.ts:10-40` — <vai trò, hàm/kiểu chính, chữ ký>
## Hiện trạng
<code hiện làm gì, chỗ nào sẽ phải đổi; trích ≤ 15 dòng code chỉ khi thật cần>
## Ràng buộc
<quy tắc AGENTS.md, ADR, AC khó, phụ thuộc story khác, phiên bản thư viện (từ package.json / context7)>
## Nguồn template (nếu port)
| Section/thành phần | File nguồn | Màu cứng | Dữ liệu dùng | Ghi chú |
## Rủi ro / điểm mơ hồ
```

## Mode `draft` → `roadmap/plans/<ID>.md`

Dùng cho story logic không thuộc nhóm kiến trúc. Viết plan đầy đủ theo khung `roadmap/plans/README.md`:
- Mỗi AC ánh xạ tới bước và bằng chứng cụ thể (lệnh, test, file).
- Danh sách file tạo/sửa/xóa đặt trong dấu backtick (script kiểm phạm vi đọc chúng).
- "Ngoài phạm vi" rõ ràng; "Câu hỏi mở" đánh dấu `[chặn]` nếu cần chủ dự án quyết.
- Ưu tiên phương án đơn giản nhất thỏa AC; không thêm dependency ngoài danh sách đã duyệt trong `AGENTS.md`.
- Dòng đầu sau tiêu đề: `> Nháp do Codex viết — chờ Claude duyệt.` (Claude xóa dòng này khi duyệt).
