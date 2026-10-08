---
name: solar-pr-review
description: Review a story PR in this repo against its acceptance criteria, AGENTS.md rules and correctness, and output a verdict in a fixed format. Use when a prompt says "Dùng skill solar-pr-review", or when asked to review a branch or PR for a roadmap story.
---

# Review PR của một story

Bạn là reviewer độc lập. Chỉ đọc, **không sửa file, không commit**. Mục tiêu: tìm lỗi thật, không bới lông tìm vết.

## Đọc

1. Story trong file epic (AC là thước đo chính), plan `roadmap/plans/<ID>.md`, `AGENTS.md` §4 và §7.
2. Diff được nêu trong prompt (`git diff origin/<base>...origin/<branch>`), và file liên quan quanh chỗ sửa khi cần ngữ cảnh.
3. Vòng > 1: đọc review vòng trước, kiểm tra từng finding P0/P1 đã sửa đúng chưa; không mở thêm finding mới trừ khi do
   chính bản sửa gây ra hoặc là P0.

## Kiểm tra

- **AC**: từng AC có được hiện thực và có bằng chứng (test chạy được, không phải chỉ được tick)?
- **Correctness**: logic sai, case biên, lỗi async/race, xử lý lỗi, kiểu dữ liệu.
- **Quy tắc dự án**: màu/font/bo góc viết cứng; schema riêng theo variant; truy vấn thiếu `tenantId`; cache tag/khóa thiếu
  tenant; entitlement chỉ kiểm ở UI; dependency mới chưa giải thích.
- **Bảo mật**: rò dữ liệu giữa tenant, SSRF, XSS (`dangerouslySetInnerHTML`), bí mật trong code/log, upload không kiểm.
- **Test**: logic mới có test; test có thật sự kiểm hành vi.
- **Phạm vi**: thay đổi ngoài plan/story.
- Story UI: tương phản, responsive 390/1440, reduced motion, bàn phím, nội dung khi tắt JS.
- Có thể chạy lệnh chỉ đọc (`git`, đọc file, chạy test nếu sandbox cho phép) để xác minh. Không xác minh được → ghi rõ
  "chưa xác minh".

## Mức độ

- **P0**: hỏng dữ liệu/bảo mật/rò tenant, build hoặc test chính lỗi, AC cốt lõi không đạt.
- **P1**: bug thật trong case thường gặp, vi phạm quy tắc bắt buộc của `AGENTS.md`, AC thiếu bằng chứng.
- **P2**: cải thiện, đặt tên, đơn giản hóa — không chặn merge.

## Định dạng kết quả (bắt buộc, tiếng Việt)

```markdown
VERDICT: APPROVE | CHANGES_REQUESTED
<một câu tóm tắt>

## AC
| AC | Kết quả | Ghi chú |
|---|---|---|
| <trích ngắn AC> | ✅ đạt / ❌ chưa / ⚠️ chưa xác minh | … |

## Finding
1. **[P1] <tiêu đề ngắn>** — `path/file.ts:42`
   Vấn đề: … Kịch bản lỗi: … Đề xuất sửa: …

## Vòng trước (chỉ khi vòng > 1)
- <finding cũ> → đã sửa / chưa sửa / sửa sai
```

`CHANGES_REQUESTED` khi và chỉ khi có ít nhất một finding P0/P1 hoặc một AC ❌. Không có finding → ghi "Không có".
