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

## Việc theo dõi ở story tiếp theo (sau khi merge PR #50 rồi #51)

PR #50 merge khi job `compare` còn đỏ ở `visual.spec.ts › /`. Lỗi nằm ở bước dựng baseline trên code base (run
39134430864, 39136637062), không do PR. Story kế tiếp (bước 0 của `/run-story`, trước khi tạo branch) làm và ghi kết quả
vào report:

1. **Baseline của base**: push merge #51 chạy `visual.yml` (job `baseline`, `matrix-baseline`) — kiểm run đó xanh
   (`gh run list --workflow visual.yml --branch mono-repo-multi-tenent --limit 1`). Đỏ ở `/` → chạy lại một lần; vẫn đỏ →
   mục 4.
2. **PR đầu tiên sau #51** (story tiếp theo): log `compare` phải có `Baseline restored from run …`, không có
   `generating from merge-base` (kiểm `scripts/ci/visual-baseline-run.sh` hoạt động); `visual.spec.ts › /` qua (có thể
   sau retry — Playwright ghi `flaky`).
3. Đạt 1 + 2 → cập nhật dòng `visual.spec.ts:5 › /` trong `tooling/visual/README.md`: "giảm nhờ PR #51 (baseline có sẵn
   + retry), còn flaky ở base — sửa gốc E14-S08", kèm run id.
4. Còn đỏ sau retry trên code của PR → không còn là baseline: chạy local
   `pnpm --filter @solar/visual exec playwright test visual.spec.ts --grep "› /$" --repeat-each=5` trên base để đo tỷ lệ
   lỗi, rồi đề xuất kéo phần ổn định trang chủ của E14-S08 (chờ ảnh/animation xong, mask vùng động) thành story nhỏ chạy
   trước; hỏi người dùng trước khi đổi phạm vi.
5. Gắn ✅ + link PR #50 cho E7-S07 và E7-S08 trong `roadmap/epics/E07-cms.md` (bước 7 của `/run-story`), cùng PR #51 vào
   ghi chú retro này nếu cần.

Kết quả (22/10, PR #52): mục 1 — run 39710282562 đỏ desktop-1440-dark, chạy lại xanh; mục 2 — `compare` của PR #52 có
`Baseline restored from run 39710282562`, `/` qua cả 4 viewport (run 39723584741); mục 3 — đã cập nhật README; mục 5 — xong.

# Retro 22/10/2026 — E6-S04 (PR #52) và 48 story có review

## Số liệu

- 48 story có review: 17 (35%) qua ở vòng 1; 21 vòng 1 `CHANGES_REQUESTED`; 10 vòng 1 APPROVE nhưng thêm vòng vì CI đỏ/sửa P2.
- Phân loại P1 vòng 1 của 5 story gần nhất (E7-S04 → E6-S04): 4/5 thuộc hai nhóm mà retro 18/10 chưa xử lý —
  `[data]` quy tắc mới phá dữ liệu có sẵn (E7-S04 `maxPerPage` × preset t08, E6-S04 fallback theme × seed t12; trước đó
  E5-S10 seed trang con, E5-S04 cột DB) và `[verify]` chọn sai/thiếu bộ kiểm local (E6-S04 bỏ `e2e tenant`, E7-S07 design
  pass đổi chữ mà e2e cũ không chạy lại, E7-S05 phép đo nhiễu).
- E6-S04: ~2 giờ 40′, lãng phí ~75′ — CI đỏ + sửa seed 2 lần (~55′), push riêng 1 dòng README (12′ + 141 phút runner),
  Codex dừng vì đòi SKILL.md của codegraph (2′, 40k token), chẩn đoán Docker 8 lượt (~10′), lượt Codex bị ngắt phải chạy
  lại turbo (7′). Review vòng 1 (Sonnet) APPROVE — dấu hiệu tốt của retro 18/10.
- CI mỗi push: Visual regression 35 job / ~145 phút runner (matrix 32 shard × 3,3′, ~1,6′ mỗi shard là setup + build +
  tải baseline), wall ~10′; Workspace wall 18–20′ (job `db`: tenant.spec 6,6′, admin.spec 5,7′) — `db` mới là đường găng.
  Matrix không chạm code E6-S04 vẫn chạy 3 lần (~435 phút runner).
- Giao tiếp Claude ↔ Codex: context chính (plan, quyết định, resume) đủ. Hụt: prompt gọi codegraph là skill; `run.mjs
  commit` rơi 9 file mới vì đuôi "(mới)"; log Codex bị ghi đè mỗi lượt nên `run.mjs skills` báo thiếu sai; report chỉ
  ghi ở cuối lượt. Chỗ "mất context" thật nằm ở plan: không có mục dữ liệu có sẵn, bộ e2e chọn theo trí nhớ.

## Thay đổi (PR chore 22/10)

| Vấn đề | Thay đổi |
|---|---|
| `[verify]` chọn e2e theo trí nhớ | `scripts/ci/checks-map.mjs`: bảng file đổi → bộ kiểm; `run.mjs verify` in "Kiểm local bắt buộc" + ghi `sha`/`requiredChecks` vào `verify.json` và PR body; plan lấy "Cách kiểm chứng" từ bảng |
| Design pass đổi chữ, spec cũ đỏ ở CI | `run.mjs stale <base>` + `verify` FAIL khi chữ đã xóa khỏi source mà test/spec vẫn tìm |
| `[data]` impact không thấy file dữ liệu | Plan mục bắt buộc "Dữ liệu có sẵn chịu ảnh hưởng"; `packages/db/src/__tests__/conformance.test.ts` |
| Matrix chạy cho mọi story | Job `changes` trong `visual.yml` dùng cùng bảng: matrix chỉ chạy khi đầu vào section lab đổi; `!**/*.md`; baseline matrix tìm run có artifact + không đổi đầu vào matrix; thêm `packages/presets/**` (trước đây thiếu) |
| Hụt giao tiếp Codex | Prompt ghi codegraph là CLI; parser commit nhận chú thích sau đường dẫn; `codex.sh` giữ log mọi lượt (`<name>.<n>.log`); report ghi dần |
| Review | `solar-pr-review`: vi phạm AGENTS.md §4 luôn ≥ P1; reviewer đối chiếu bộ kiểm bắt buộc trên đúng SHA (không "suy luận không hồi quy"); nhãn nguyên nhân `[data] [verify] [req] [edge] [sec] [rule] [simplify]` |
| Thời gian chết | Bước 0 kiểm Docker một lần rồi báo; gộp push tài liệu vào lần push sửa |

## Ước tính mỗi story (đo lại sau 3 story, đếm theo nhãn finding)

| | Trước | Sau (ước tính) | Cơ sở |
|---|---|---|---|
| Vòng review/CI trung bình | ~1,9 | ~1,4 | `[data]` + `[verify]` gây ~4/5 vòng thêm gần đây; giả định chặn được ~60% |
| Thời gian | ~2–2,7 giờ | −25 đến −40′ (≈ 20–25%) | mỗi vòng thêm ≈ 40–55′ (CI 20′ + sửa/kiểm local + review); + lỗi công cụ 5–10′; − thêm ~5′ cho mục dữ liệu và bộ kiểm local đầy đủ |
| Token Claude (+ subagent review) | — | −150 đến −250k | mỗi vòng thêm: điều phối/đọc log ~60–120k + review 85–110k |
| Token Codex | — | −40k đến −300k | lượt bị chặn ~40k; mỗi vòng sửa do Codex làm 150–300k |
| Phút runner CI | ~145/push visual | −250 đến −400/story không đụng section | matrix ~105/push × ~2,5 push + push base; push chỉ tài liệu bỏ hẳn visual |

Việc theo dõi: sau 3 story — đếm nhãn finding vòng 1, số vòng, phút runner visual; nếu `[data]`/`[verify]` vẫn ≥ 1/story
thì xem lại bảng `checks-map.mjs`. Matrix chọn theo section/theme bị đổi (thay vì cả 32 shard) để story riêng.
