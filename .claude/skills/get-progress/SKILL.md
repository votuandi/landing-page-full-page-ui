---
name: get-progress
description: Báo cáo % tiến độ và ước lượng thời gian còn lại của story/epic đang làm (theo các bước của /run-story và lịch sử thời gian làm các story đã xong). Dùng khi người dùng gõ /get-progress [STORY-ID|Ex] hoặc hỏi "đang tới đâu rồi", "còn bao lâu nữa".
argument-hint: "[STORY-ID|Ex]"
---

# /get-progress — % tiến độ + thời gian còn lại

Tham số: `$ARGUMENTS` — `E5-S08` (story), `E5` (epic) hoặc bỏ trống (lấy story từ tên branch hiện tại; branch không
có ID → story `next`).

Chỉ đọc, không sửa file, không gọi Codex. Một lệnh là đủ:

```bash
node scripts/agents/story.mjs progress $ARGUMENTS
```

## Cách script tính (để giải thích khi được hỏi)

- **% story** theo dấu vết `/run-story` để lại: chưa bắt đầu 0 · có plan 15 · có branch 25 · có commit code 50–55 ·
  verify qua 60 · có PR 70 · mỗi vòng review +5 (tối đa 90) · review `APPROVE` 95 · ✅ trong epic 100.
- **% epic** = trung bình % các story, trọng số theo cỡ (S=1, M=2, L=4).
- **Thời gian**: "phút làm thực" của mỗi story = cộng khoảng giữa các mốc (mtime file trong `.agent-runs/<ID>`, commit
  trên branch), bỏ khoảng lặng > `history.idleCutoffMinutes`. Ước lượng story = trung vị phút làm của story đã xong cùng
  cỡ (`history.bySize`); còn lại = ước lượng × (1 − %). Epic còn lại = tổng phần còn lại các story.

## Báo cáo (tiếng Việt, ngắn)

```
**<story.id> · <story.title>** — <story.percent>% · <story.step>
Đã làm ~<elapsed> · ước lượng <estimate> (cỡ <size>) · còn ~<remaining>
AC: <ac> · PR: <facts.pr | chưa có>

**Epic <epic.id>** — <epic.percent>% (<storiesDone>/<storiesTotal> story) · còn ~<epic.remaining>
| Story | Cỡ | % | Bước |   ← chỉ story chưa xong; story chưa đủ phụ thuộc ghi "(chờ phụ thuộc)"
```

- Đổi phút ra "X giờ Y phút"; ≥ 8 giờ thì kèm số ngày làm (8 giờ/ngày).
- `story = null` (tham số là epic) → bỏ phần story.
- `overEstimate: true` → thêm một dòng: đã vượt trung vị cùng cỡ, phần còn lại có thể dài hơn.
- Mẫu lịch sử của cỡ đó < 2 (`samples`) → ghi "ước lượng thô (ít dữ liệu)".
- Ghi một dòng lưu ý: thời gian là phút agent làm thực, không gồm thời gian chờ người dùng duyệt/merge hay chờ CI.
- Nếu đang trong phiên `/run-story` và biết bước thực tế khác với `step` (vd. Codex đang chạy nền bước 3) → nói theo
  bước thực tế và nêu lý do lệch.
