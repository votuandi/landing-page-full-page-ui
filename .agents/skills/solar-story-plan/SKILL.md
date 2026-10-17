---
name: solar-story-plan
description: Prepare planning input for a roadmap story so Claude spends fewer tokens — either a discovery brief (relevant files, current code, constraints) or a full draft plan in roadmap/plans/<ID>.md for Claude to approve. Use when a prompt says "Dùng skill solar-story-plan" with mode brief or draft.
---

# Chuẩn bị plan cho story

Mục tiêu: bạn làm phần đọc nhiều (khảo sát code, branch template, tài liệu), Claude chỉ đọc kết quả cô đọng. Chỉ đọc
repo, **không sửa code**. File được ghi: đúng file output trong prompt. Claude tự viết plan (`planPolicy: claude`) cũng
làm theo các quy tắc khảo sát và khung plan dưới đây.

Đọc trước: `AGENTS.md`, block story trong file epic (ID trong prompt) + phần đầu epic, `roadmap/02-decisions.md` (ADR liên
quan), `roadmap/plans/README.md` (khung plan). Story port template: đọc nguồn bằng `git show origin/template-NN:<path>` và
bảng ở `roadmap/01-template-analysis.md`.

**Skill như Claude**: dòng `Skill plan:` của prompt (từ `S.skills.plan`) — mở `.agents/skills/<tên>/SKILL.md` trước
khi dùng (`graphify` có SKILL.md; `codegraph` là CLI). Skill theo việc trong `S.skills.whenRelevant` cũng vậy.

**Khảo sát code: đồ thị trước, file sau.** Ghi các truy vấn đã dùng vào plan (mục "Bối cảnh đã khảo sát").
1. `codegraph sync` (vài giây), rồi `codegraph explore "<chủ đề>"` / `codegraph node <symbol>` / `codegraph impact
   <symbol>` để định vị code và nơi sẽ bị ảnh hưởng. Chưa có `.codegraph/` → `codegraph init -y` (index local, đặt
   `CODEGRAPH_TELEMETRY=0`).
2. Câu hỏi kiến trúc dính cả tài liệu/ADR (skill `graphify`): `python -m graphify query "<câu hỏi>" --budget 1500`;
   đồ thị cũ hơn base → `python -m graphify update .` trước (AST, không cần LLM). Lỗi → bỏ qua.
3. Chỉ mở các file/dòng mà đồ thị trỏ tới. **Soát hạ tầng tái dùng**: helper cùng loại, lab route `apps/web /lab/*`,
   spec/config `tooling/visual`, fixture, script `scripts/agents/*` — ghi vào mục "Hạ tầng tái dùng".

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
## Hạ tầng tái dùng
## Case biên gợi ý (theo checklists.md)
## Rủi ro / điểm mơ hồ
```

## Mode `draft` → `roadmap/plans/<ID>.md`

Dùng cho story logic không thuộc nhóm kiến trúc. Viết plan đầy đủ theo khung `roadmap/plans/README.md`:
- Mỗi AC ánh xạ tới bước và bằng chứng cụ thể (lệnh, test, file).
- Mục bắt buộc: "Hạ tầng tái dùng", "Case biên & bất biến" (lấy từ `.agents/skills/solar-pr-review/checklists.md`
  theo loại story, mỗi dòng một test), "Cách kiểm chứng". Kiểm "Ngưỡng tách story" trong khung plan.
- Danh sách file tạo/sửa/xóa đặt trong dấu backtick (script kiểm phạm vi đọc chúng).
- "Ngoài phạm vi" rõ ràng; "Câu hỏi mở" đánh dấu `[chặn]` nếu cần chủ dự án quyết.
- Ưu tiên phương án đơn giản nhất thỏa AC; không thêm dependency ngoài danh sách đã duyệt trong `AGENTS.md`.
- Dòng đầu sau tiêu đề: `> Nháp do Codex viết — chờ Claude duyệt.` (Claude xóa dòng này khi duyệt).
