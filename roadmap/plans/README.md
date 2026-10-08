# Plan của story

Mỗi story chạy bằng `/run-story` có một plan `roadmap/plans/<STORY-ID>.md`, do Claude viết trước khi thực thi và được
commit làm commit đầu tiên của branch story. Người thực thi (Codex hoặc Claude) làm theo plan; reviewer đối chiếu plan.

## Khung plan

```markdown
# Plan <ID> — <tiêu đề story>

- Story: roadmap/epics/<file>.md · Cỡ: S|M|L
- Loại: ui | logic · Người thực thi: codex | claude · Reviewer: codex | claude
- Branch: <type>/<ID>-<slug> từ mono-repo-multi-tenent

## Mục tiêu
<1–3 câu: kết quả người dùng/dev nhận được>

## Bối cảnh đã khảo sát
- File/hàm hiện có liên quan (đường dẫn:dòng), ADR áp dụng (D1…D14), story phụ thuộc đã xong.

## Thiết kế
- Quyết định chính + lý do; chữ ký hàm/kiểu/cấu trúc thư mục cần chốt.

## Các bước
1. <việc> — file: … — kiểm bằng: …
2. …

## AC → bằng chứng
| AC | Bước | Bằng chứng sẽ có |
|---|---|---|

## Lệnh kiểm tra
- <lệnh chung của repo>
- <lệnh riêng của story>

## Ngoài phạm vi
- <thứ không được đụng, story khác sẽ làm>

## Rủi ro / câu hỏi mở
- [chặn] … → đã hỏi người dùng: <câu trả lời>
- [không chặn] … → chọn: … vì …
```
