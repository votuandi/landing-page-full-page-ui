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
- Truy vấn đã dùng: `codegraph explore/impact …`, `graphify query …` (nếu có) — để reviewer thấy phạm vi đã soát.

## Yêu cầu → test (bắt buộc)
| # | Yêu cầu (trích AC / Chi tiết / Target / hành vi template gốc) | Ví dụ: input → kết quả mong đợi | Test |
|---|---|---|---|
| R1 | … | … | `<file>.test.ts` › "<tên>" |
- Mỗi gạch đầu dòng của story một dòng; yêu cầu bị tách/hoãn ghi rõ story nhận. Đây là thước đo "chưa cover" của reviewer
  — phần lớn vòng review lặp trước đây đến từ yêu cầu trong "Chi tiết" không có dòng ở plan (E5-S04, E7-S06, E3-S03).

## Hạ tầng tái dùng (bắt buộc)
- Thứ đã có trong repo sẽ dùng thay vì viết mới: helper, lab route (`apps/web /lab/*` với `LAB_ENABLED`),
  spec/config trong `tooling/visual`, fixture, script `scripts/agents/*`. Ghi "không có" nếu đã soát mà không thấy.

## Thiết kế
- Quyết định chính + lý do; chữ ký hàm/kiểu/cấu trúc thư mục cần chốt.

## Case biên & bất biến (bắt buộc)
| # | Tình huống / bất biến | Hành vi mong đợi | Test sẽ chứng minh |
|---|---|---|---|
| 1 | … | … | `<file>.test.ts` › "<tên test>" |
- Lấy từ checklist theo loại story trong `.agents/skills/solar-pr-review/checklists.md` (ui / logic / data / auth).
  Mỗi dòng là một test sẽ viết trước (TDD). Reviewer dùng bảng này làm thước đo "Chưa cover".

## Cách kiểm chứng (bắt buộc)
- Unit (`node:test`), tương tác (jsdom / React Testing), e2e (spec nào, chạy trên trang nào — trang cần DB/đăng nhập
  thì dùng lab route), ảnh 390/1440. Ghi rõ lệnh chạy. Không ghi "không test được" mà không có phương án thay.

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

## Độ dài

Plan ≤ ~8 KB: Codex và reviewer đọc lại plan mỗi vòng. "Bối cảnh" chỉ ghi `đường dẫn:dòng` + một câu, không chép code;
không lặp nội dung giữa các mục.

## Ngưỡng tách story

Story cỡ **L**, hoặc plan dự kiến **> 30 file / > 1.500 dòng**, hoặc gom ≥ 3 khối độc lập (vd. lõi + nhiều widget + màn
hình + e2e) → đề xuất tách thành các phần merge riêng (`<ID>a`, `<ID>b`…), mỗi phần một PR, AC chia theo phần. Hỏi người
dùng (`[chặn]`) trước khi tách. PR nhỏ = reviewer đọc ít, vòng review ngắn.
