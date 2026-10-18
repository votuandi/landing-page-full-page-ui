# Retro 18/10/2026 — vì sao story cần nhiều vòng review, và thời gian/token đi đâu

Nguồn: `.agent-runs/*/review-r*.md` của 47 story (E0 → E15-S01), log/timeline của E7-S07 + E7-S08 (PR #50), CI PR #50.

## Số liệu

| Nhóm | Số vòng review | Ghi chú |
|---|---|---|
| E0–E3 (package thuần, ít DB) | 1–2 (trung bình ~1,5) | Hầu hết vòng 1 chỉ có P2 |
| E5 (tenant, cache, RLS) | 2–4 | P0/P1 thật về bảo mật/đồng thời — reviewer có giá trị |
| E7-S03 (L) | 6 vòng sửa | Cùng một vùng (`convert.ts` link metadata) bị báo lại 4 vòng |
| E5-S04 (L) | 4 | Vòng 1: 10 P1; vòng 2 "finding 9 sửa một phần" + 6 P1 về CI/matrix |
| Sau retro E7-S03 (E7-S04…S07) | 2–3 | Thường: 1 vòng sửa thật + 1 vòng chờ bằng chứng CI/sửa nhỏ |

PR #50: ~2 giờ 40 phút. Trong đó Codex dựng 80 phút (≈ 25 phút tự tải Postgres/pnpm/codegraph/trình duyệt, chạy
`pnpm turbo run typecheck lint test` toàn repo **115+ lần**, log 25 MB). CI ~70 phút qua 3 lần push (job `db` 17 phút
tuần tự; visual phải dựng lại baseline mỗi PR; flaky `visual.spec.ts › /`).

## Nguyên nhân gốc (xếp theo số vòng gây ra)

1. **Sửa triệu chứng, không sửa lớp lỗi.** Finding được vá đúng một kịch bản; các caller/locale/variant khác cùng mẫu
   không được soát → vòng sau "sửa một phần" hoặc lỗi mới cùng chỗ (E7-S03 r1→r5, E5-S04 PriceTag, E5-S10 structure,
   E3-S03 lazy, E7-S04 dữ liệu preset t08).
2. **Plan thiếu yêu cầu.** Bảng "Case biên" chỉ phủ case kỹ thuật; yêu cầu trong "Chi tiết"/hành vi template gốc không có
   dòng ở plan → người viết không làm, reviewer phát hiện ở vòng 1 (E5-S04 nhãn EN, quan hệ tùy chọn; E7-S06 chọn danh
   mục bằng UUID; E3-S03 lazy theo section). Test do chính người viết viết nên kiểm cách hiện thực, không kiểm yêu cầu.
3. **Kiểm thử dồn cho CI.** E2E/DB test không chạy ở local (thiếu Postgres) → lỗi chỉ lộ ở CI, mỗi lần sửa = một vòng push
   ~25 phút + một vòng review "xác nhận" (E7-S05 đo AC1, E5-S06 TTFB, E7-S07 e2e chữ "Đã khóa").
4. **Story quá lớn.** Hai story nhiều vòng nhất đều cỡ L, ≥ 3 khối độc lập (E7-S03, E5-S04).
5. **Finding không hiệu chỉnh.** Một số P1 là bằng chứng CI/phép đo nhiễu hoặc cải thiện UX ngoài AC → thêm vòng.

Kết luận: chất lượng code không tệ đồng đều (E0–E3 ổn). Vòng lặp tập trung ở: story lớn, phần tenant/DB, và cách sửa
finding + cách viết plan + kiểm thử dồn cho CI — đều là vấn đề quy trình, sửa được.

## Thay đổi (PR chore sau retro)

| Nguyên nhân | Thay đổi |
|---|---|
| 1 | `solar-story-exec` bước 2b "Quét cùng loại" (codegraph callers + grep, sửa hết, test dạng bảng phủ cả lớp lỗi); báo cáo mỗi finding có Bất biến · Nơi đã soát · Test. `run-story`: vòng 2 còn "sửa một phần" → thiết kế lại theo bất biến ngay (trước đây vòng 3) |
| 2 | Plan có mục bắt buộc **"Yêu cầu → test"** (mỗi gạch đầu dòng AC/Chi tiết/Target + ví dụ input → kết quả); `run.mjs verify` cảnh báo khi thiếu; reviewer đối chiếu bảng này trước, yêu cầu không có trong plan ghi "plan thiếu" |
| 3 | `scripts/local-ci.sh` (Postgres 16 + Redis giống job `db`): `up`, `db`, `e2e <config>`; quy tắc local-first trong `AGENTS.md` §3 và `run-story` bước 4/vòng sửa |
| 4 | Giữ ngưỡng tách story (đã có); áp dụng chặt cho L |
| 5 | `solar-pr-review`: P1 phải có kịch bản lỗi cụ thể hoặc AC/yêu cầu fail; bằng chứng chỉ có ở CI/phép đo nhiễu → `[ngoài agent]` |
| Thời gian Codex | Môi trường dùng chung `.agent-runs/_codex-env` (pnpm, codegraph) + DB do Claude dựng; test theo phạm vi, full turbo ≤ 2 lần, log ra file; chỉ bắt buộc `ponytail`, `verification-before-completion`, `codegraph` |
| Sửa nhỏ | ≤ ~30 dòng → Claude sửa trực tiếp, không khởi động phiên Codex |
| Codex mất context mỗi lượt | `scripts/agents/codex.sh`: lượt dựng code lưu session id; lượt sửa/"Tiếp tục" của cùng story dùng `codex exec resume` (nhớ plan, code đã viết); tự về phiên mới sau 4 lần resume hoặc khi lỗi; review luôn phiên mới read-only |
| CI | Baseline visual lấy từ lần chạy xanh gần nhất có cùng input (`scripts/ci/visual-baseline-run.sh`), visual retry 1 lần trên CI, e2e admin tách job song song, cache trình duyệt, Windows chỉ khi push lên base |

Ước tính: ~2 giờ 40 phút → ~1 giờ 15 phút mỗi story cỡ M; vòng review mục tiêu ≤ 2. Đo lại sau 3 story (đếm
`review-r*.md`, thời gian từ commit plan tới APPROVE) và cập nhật file này.

## Việc ngoài repo
- Vercel: tắt deploy từ Git cho các project template cũ trên branch `mono-repo-multi-tenent` (12 check đỏ do giới hạn
  build làm PR luôn `UNSTABLE`).
