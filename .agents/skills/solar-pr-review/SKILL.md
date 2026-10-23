---
name: solar-pr-review
description: Review a story PR in this repo against its acceptance criteria, AGENTS.md rules and correctness, and output a verdict in a fixed format. Use when a prompt says "Dùng skill solar-pr-review", or when asked to review a branch or PR for a roadmap story.
---

# Review PR của một story

Bạn là reviewer độc lập. Chỉ đọc, **không sửa file, không commit**. Mục tiêu: tìm lỗi thật, không bới lông tìm vết.

## Đọc

1. Story trong file epic (AC là thước đo chính), plan `roadmap/plans/<ID>.md`, `AGENTS.md` §4 và §7.
2. Diff được nêu trong prompt (`git diff origin/<base>...origin/<branch>`), và file liên quan quanh chỗ sửa khi cần ngữ cảnh.
3. Checklist case biên theo loại story: `checklists.md` (cùng thư mục) + bảng "Case biên & bất biến" trong plan.
4. Định vị nhanh: `codegraph explore "<chủ đề>"`, `codegraph impact <symbol>` (nơi bị ảnh hưởng khi symbol đổi) thay vì
   đọc cả cây.

## Vòng 1 và các vòng sau

- **Vòng 1 — soát hết một lần**: liệt kê *mọi* finding và *mọi* mục "Chưa cover" có thể thấy (đối chiếu AC, Chi tiết,
  Target, plan, DoD, checklist). Vòng sau không được "phát hiện thêm" thứ đã có sẵn ở vòng 1 — nên vòng 1 phải kỹ.
- **Vòng > 1 — chỉ soát phần sửa**: prompt cho `<SHA vòng trước>`. Đọc `git diff <SHA vòng trước>..<HEAD>` (không đọc lại
  cả PR). Việc cần làm: (a) từng finding P0/P1 và mục "Chưa cover" của vòng trước → đã sửa / chưa / sửa sai, có test
  chưa; (b) hồi quy do chính bản sửa gây ra (dùng `codegraph impact` trên symbol vừa sửa); (c) P0 mới ở bất cứ đâu.
  Không mở finding P1/P2 hay mục "Chưa cover" mới ngoài (b)/(c). Thứ chỉ nên làm thêm (P2, ý tưởng) → ghi "Gợi ý", không
  chặn merge.

## Khi review code do chính bạn (cùng loại agent) viết

Prompt ghi "Tự review" → bạn dễ có cùng điểm mù với người viết. Làm thêm:
- Đọc **AC và plan trước, diff sau**; tự viết ra (trong đầu) cách bạn sẽ hiện thực từng AC, rồi so với diff.
- Giả định có lỗi: với mỗi file, tìm ít nhất một kịch bản làm nó sai (input rỗng/lớn, tenant khác, lỗi mạng, chạy đồng thời).
- Không tin báo cáo của người viết; tự chạy test liên quan nếu sandbox cho phép, ghi lệnh và kết quả.
- Kiểm lại những gì test **không** phủ.

## Kiểm tra

- **AC**: từng AC có được hiện thực và có bằng chứng (test chạy được, không phải chỉ được tick)?
- **Độ phủ yêu cầu**: ngoài AC, đối chiếu "Chi tiết", "Target" của story, plan và DoD (`AGENTS.md` §7). Liệt kê mọi case
  chưa được cover: nhánh/điều kiện AC nói tới nhưng code không xử lý, case AC ngầm đòi hỏi (input rỗng, lỗi, OS/phiên bản
  khác, tenant khác…), yêu cầu trong "Chi tiết"/"Target" chưa làm, hoặc đã làm nhưng không có test/bằng chứng.
- **Correctness**: logic sai, case biên, lỗi async/race, xử lý lỗi, kiểu dữ liệu.
- **Quy tắc dự án**: màu/font/bo góc viết cứng; schema riêng theo variant; truy vấn thiếu `tenantId`; cache tag/khóa thiếu
  tenant; entitlement chỉ kiểm ở UI; dependency mới chưa giải thích.
- **Bảo mật**: rò dữ liệu giữa tenant, SSRF, XSS (`dangerouslySetInnerHTML`), bí mật trong code/log, upload không kiểm.
- **Test**: logic mới có test; test có thật sự kiểm hành vi.
- **Phạm vi**: thay đổi ngoài plan/story.
- **Over-engineering** (skill `ponytail-review`, nếu đã cài): code, abstraction, cấu hình hoặc dependency thừa so với AC;
  tự viết lại thứ đã có sẵn trong repo, stdlib hoặc nền tảng. Mức tối đa P2, trừ khi gây lỗi hoặc vi phạm `AGENTS.md`.
- Story UI: tương phản, responsive 390/1440, reduced motion, bàn phím, nội dung khi tắt JS (chi tiết: `checklists.md`).
- **Bảng case biên trong plan**: mỗi dòng có test tương ứng thật sự chạy và kiểm đúng hành vi; dòng thiếu → "Chưa cover".
- **Dữ liệu có sẵn** (`[data]`): diff thêm/đổi quy tắc, validator, fallback, giới hạn → plan có mục "Dữ liệu có sẵn chịu
  ảnh hưởng" và `packages/db/src/__tests__/conformance.test.ts` (hoặc test preset × gói) chạy quy tắc đó trên mọi preset,
  seed demo, fixture. Thiếu → "Chưa cover". `codegraph impact` không thấy file dữ liệu — tự grep preset JSON/seed.
- **Kiểm local theo phạm vi story** (`[verify]`): `verify.json` → `requiredChecks` (unit/int package bị ảnh hưởng + test
  e2e mới/sửa; story regression: mọi bộ) phải có kết quả trên đúng SHA được review (report "Lệnh kiểm tra"). Thiếu hoặc
  khác SHA → "Chưa cover". Code mới không có unit/int hay e2e nào cover (cảnh báo "code mới phải được cover" của
  `verify`) → "Chưa cover". Không đòi chạy cả bộ e2e ở story thường; không viết "suy luận không hồi quy" thay cho kết quả.
- **Report của người viết**: có dòng "Skill đã dùng" và mục "Tự review" (bước 4.5); thiếu → P2, ghi vào kết quả.
  `node scripts/agents/run.mjs skills <ID>` báo skill bắt buộc người viết chưa mở / ghi "đã dùng" mà log không thấy → P2.
- **Skill của reviewer** (như Claude): danh sách ở dòng `Skill review:` của prompt (từ `S.skills.review`; không có →
  `story.mjs info <ID>`). Mở `.agents/skills/<tên>/SKILL.md` trước khi dùng — `ponytail-review` cho over-engineering,
  `web-design-guidelines` cho story UI, `security-and-hardening` cho tenant/auth/upload; `codegraph impact` (CLI) cho
  symbol công khai bị sửa. Ghi skill đã dùng vào cuối kết quả review.
- Có thể chạy lệnh chỉ đọc (`git`, đọc file, chạy test nếu sandbox cho phép) để xác minh. Không xác minh được → ghi rõ
  "chưa xác minh".

## Mức độ

- **P0**: hỏng dữ liệu/bảo mật/rò tenant, build hoặc test chính lỗi, AC cốt lõi không đạt.
- **P1**: bug thật trong case thường gặp, vi phạm quy tắc bắt buộc của `AGENTS.md`, AC thiếu bằng chứng. Vi phạm
  `AGENTS.md` §4 (token, `tenantId`, `requirePermission(...)` trên mọi Server Action/route admin, entitlement phía server)
  **luôn ≥ P1**, kể cả khi plan chủ ý làm vậy (plan sai → ghi thêm "plan thiếu"). Dữ liệu người dùng nhập/gõ tay (form,
  file nhập CSV/JSON) bị đọc sai hoặc từ chối nhầm ở giá trị thường gặp → **≥ P1** (E7-S14: tiêu đề "[DỮ LIỆU MẪU] …" bị
  đọc như JSON, vòng 1 xếp P2, CI mới lộ).
- **P2**: cải thiện, đặt tên, đơn giản hóa, over-engineering không gây lỗi. Không chặn merge.
- Hiệu chỉnh: P1 phải chỉ ra **kịch bản lỗi cụ thể** (input/thao tác → kết quả sai) hoặc một dòng "Yêu cầu → test"/AC
  không đạt. Cải thiện UX không có trong AC/Chi tiết → P2. Bằng chứng chỉ có ở CI (Windows, TTFB, e2e chưa chạy) hoặc phép
  đo nhiễu → mục `[ngoài agent]` kèm cách đo, không phải P1 — trừ khi bằng chứng hiện có cho thấy AC thất bại.
- Đối chiếu theo thứ tự: bảng "Yêu cầu → test" và "Case biên" của plan → AC → diff. Yêu cầu của story không có dòng trong
  plan → "Chưa cover" và ghi "plan thiếu" (để Claude bổ sung quy trình), không chỉ đòi người viết sửa.

## Định dạng kết quả (bắt buộc, tiếng Việt)

Mỗi finding và mục "Chưa cover" gắn đúng một nhãn nguyên nhân (để retro đếm, không phải đọc lại): `[data]` quy tắc mới
phá dữ liệu có sẵn · `[verify]` thiếu/sai bộ kiểm local hoặc spec cũ · `[req]` plan/code thiếu yêu cầu của story ·
`[edge]` case biên/input/async · `[sec]` bảo mật/tenant · `[rule]` quy tắc AGENTS.md · `[simplify]` over-engineering.

```markdown
VERDICT: APPROVE | CHANGES_REQUESTED
<một câu tóm tắt>

## AC
| AC | Kết quả | Ghi chú |
|---|---|---|
| <trích ngắn AC> | ✅ đạt / ❌ chưa / ⚠️ chưa xác minh | … |

## Finding
1. **[P1][edge] <tiêu đề ngắn>** — `path/file.ts:42`
   Vấn đề: … Kịch bản lỗi: … Đề xuất sửa: …

## Chưa cover (AC / yêu cầu)
1. **[req] <AC hoặc yêu cầu, trích ngắn>** — case chưa cover: … · Cần thêm: <code/test/bằng chứng cụ thể>
   (Ngoài khả năng của agent, vd. cần CI/người dùng → ghi thêm `[ngoài agent]`.)

## Vòng trước (chỉ khi vòng > 1)
- <finding / mục chưa cover cũ> → đã sửa / chưa sửa / sửa sai
```

`CHANGES_REQUESTED` khi và chỉ khi có ít nhất một finding P0/P1, một AC ❌, hoặc một mục "Chưa cover" không gắn
`[ngoài agent]`. Mục nào trống → ghi "Không có".
