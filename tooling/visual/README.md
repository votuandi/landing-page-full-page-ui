# Hồi quy ảnh t15

## Preset E4

`/lab/presets` liệt kê preset; `/lab/presets/<id>?theme=<themeId>` render toàn bộ preset bằng theme chọn.
Production cần `LAB_ENABLED=true`. `/lab/legacy-home` giữ app cũ độc lập làm mốc E4, xóa ở E5-S04.

```sh
pnpm --filter web build
LAB_ENABLED=true pnpm --filter web start --port 3210
pnpm --filter @solar/visual exec playwright test -c playwright.sections.config.ts
node tooling/visual/ttfb.mjs http://localhost:3210/lab/legacy-home http://localhost:3210/ --n 50
node tooling/visual/template-compare.mjs t15 --app http://localhost:3210
```

PowerShell: đặt `$env:LAB_ENABLED = 'true'` trước lệnh start. Giữ cùng build/máy/cấu hình khi đo TTFB.
Script warm-up mỗi URL 5 lần, đo tuần tự xen kẽ 50 request mỗi URL tới lúc nhận response headers, in median/p90 (ms)
và % chênh. HTTP khác 200 hoặc timeout làm phép đo fail. `/` hiện được prerender, lab render động; báo cáo phải
ghi rõ khác biệt cache này khi diễn giải số liệu, không coi nó là phép đo riêng chi phí `PageRenderer`.

`preset-home.spec.ts` so PNG full page legacy với `/` ngay trong cùng test ở 390/1440 và luôn ghi tỷ lệ pixel khác
(annotation `preset-match` + `roadmap/evidence/E4/t15/match.json`). Mục tiêu 0,5% chỉ chặn khi `PRESET_MATCH_STRICT=1`
(chiều cao một số section còn lệch nên CI chỉ ghi số đo).
Expected luôn lấy từ route legacy độc lập, không lấy từ trang mới. Mask chỉ marquee, iframe/video và counter;
không che section bị lệch. JPEG q15 (4 ảnh dưới 3 MB) lưu trong `roadmap/evidence/E4/t15/{legacy,preset}-{390,1440}.jpg` cho design pass.
Spec kiểm route/theme không tồn tại, chrome không trùng, dark mode trên trang con, giỏ và menu mobile.

`template-compare.mjs <id> [--port 4100] [--out <dir>] [--app <url>]` đọc `source.branch`, tạo/reuse detached
worktree `../.solar-template-worktrees/<branch>`, kiểm nó khớp `origin/<branch>`, cài theo lockfile rồi chạy Next dev.
Chụp `/` gốc và `/lab/presets/<id>` của app đang chạy ở 390/1440, reduced motion, fonts/images sẵn sàng.
Media demo bị Git ignore được liên kết từ `apps/web/public/{images,videos,news,products}` khi worktree thiếu thư mục đó.
Lưu JPEG q45 `before-<width>.jpg`, `after-<width>.jpg`; tổng vượt 3 MB thì chụp lại ở quality thấp hơn.
In tổng byte/MB, đóng browser/server khi xong.
Không chạy script này trong turbo test. Cần quyền ghi Git/worktree và thư mục ngoài repo; Codex sandbox hiện tại
không có quyền đó, Claude chạy bước này trong design pass. Worktree được giữ để tái sử dụng.

Ảnh evidence, baseline và log bị ignore, đính kèm PR qua playbook thay vì commit.

Workflow compare chỉ tải baseline có `headSha` đúng merge-base. Nếu thiếu, dựng chính merge-base bằng Webpack
và sinh baseline từ source đó với harness PR; không dùng run thành công cũ hơn. E5-S04 xác nhận baseline `aa10450`
trước port E4 gây 48 ảnh lệch so với base `3545ab6`: `/cam-nang` mobile kỳ vọng cũ 12.726px, base đúng 12.694px.
So nhánh S04 với baseline sinh tại `3545ab6` qua 64/64 (48 ảnh + 16 kiểm route lab), ngưỡng ảnh vẫn 0,5%.
Không cập nhật baseline từ code mới của PR để che regression.

`@solar/visual` là package kiểm tra dành cho dev/CI, không thêm dependency runtime.
12 route đại diện cho toàn bộ loại trang hiện tại × 390×844 / 1440×900 × light / dark = **48 ảnh Chromium**.
Slug cố định và nguồn dữ liệu nằm trong `routes.ts`. Catalog bật mặc định nên cả `/san-pham` và chi tiết
sản phẩm đều được chụp (epic ban đầu ước tính 11 route). Không tự bỏ qua route 404.

Chạy từ gốc repo, dùng Node 22 và pnpm theo `packageManager`:

```sh
pnpm install --frozen-lockfile
pnpm --filter @solar/visual exec playwright install chromium
pnpm visual:update
pnpm visual:test
pnpm --filter @solar/visual exec playwright show-report
```

Hai script gốc build `web` qua cache Turbo trước khi chạy. Server production dùng cổng **3210**;
hãy dừng server cũ trên cổng này trước khi kiểm thay đổi. `turbo run test` chỉ chạy unit test, không cần browser.
`visual:test` thiếu baseline sẽ fail; chỉ `visual:update` mới tạo hoặc thay baseline. Report HTML luôn có ở
`tooling/visual/playwright-report/index.html`; khi lệch, report đính expected/actual/diff và trace trong `test-results`.

Chỉ chạy `visual:update` khi tạo baseline lần đầu hoặc đã xác nhận thay đổi giao diện có chủ đích. Xem ảnh/report
trước khi chấp nhận; giữ ngưỡng `maxDiffPixelRatio: 0.005` (0,5%). Sau update chạy `visual:test` ba lần liên tiếp
để kiểm độ ổn định. Thời gian mục tiêu ≤ 3 phút không gồm build/browser install.
Playwright dùng số worker mặc định; nếu máy Windows báo `ERR_INSUFFICIENT_RESOURCES` khi nhiều browser tải ảnh
cùng lúc, đặt `$env:VISUAL_WORKERS = '2'` trong PowerShell trước khi chạy các lệnh trên.
Nếu sandbox chặn Playwright dừng cây tiến trình Windows (`taskkill`), build trước rồi chạy
`pnpm --filter web start --port 3210` trong terminal riêng; harness sẽ tái sử dụng server local. Dừng và khởi động
lại server sau mỗi thay đổi/build để tránh chụp bản cũ. CI Linux vẫn tự quản lý server.

Harness đặt theme và tiếng Việt trước navigation, dùng context mới mỗi test, tắt chuyển động, chờ network/font/image,
cuộn toàn trang rồi về đầu. CSS trong harness buộc section/footer được vẽ khi chụp full page, tránh phần trắng do
`content-visibility`. Che marquee, iframe/video và các số đếm bằng selector hiện có; nhãn, bố cục và phần còn lại
vẫn được so sánh. Popup tư vấn tự bật được đánh dấu đã hiện trong sessionStorage. Không đổi giao diện app.

## Test flaky đã biết

Test gắn tag `@quarantine` (hiện có `visual.spec.ts:5 › /`) bị bỏ qua ở PR thường (`--grep-invert @quarantine`) và chỉ chạy ở
story regression (nhãn PR `regression`). Sửa gốc xong thì bỏ tag.

Chỉ ghi test đã có bằng chứng (log chạy trên base). Test lỗi ngoài danh sách → coi là hồi quy cho tới khi chạy lại trên
base (`VISUAL_WEB_ROOT=<worktree base>`, chép `packages/db/generated` vào worktree) chứng minh ngược lại.

| Test | Hiện tượng | Bằng chứng | Ghi chú |
|---|---|---|---|
| `preset-home.spec.ts:79` (home and subpages share widgets, dark mode…) | Khi chạy song song, bấm nút theme trước khi hydrate xong → `data-theme` vẫn `light` | E7-S03: base lỗi cùng test (`.agent-runs/E7-S03/e2e-base2.log`), chạy riêng qua | Sửa ở E14-S08: chờ hydrate trước khi bấm |
| `tenant.spec.ts:175` (home section, quick view, packages and actual cart keep EN prices…) — CI job `db` | `page.reload({ waitUntil: "networkidle" })` quá 30 s, lỗi cả lần retry | PR #45: qua ở `6437cd5`, `2e76bc0`; lỗi ở `1a11de7`, `125610e` dù code mà test chạy qua giống hệt (khác nhau chỉ trong `packages/cms-ui`, chỉ trang lab dùng). Workflow đã ghi "tenant e2e flakes". Base `059e743` đỏ y hệt (run 39044030788); PR #47 đỏ 2 lần chạy × retry | **Đã sửa ở PR #47 (E7-S04)**: reload chờ `load`, bấm "Quick view" lặp bằng `toPass` tới khi dialog mở (đã hydrate). Còn đỏ → mở lại mục này |
| `visual.spec.ts:5 › /` — job `baseline` của base, kéo theo job `compare` của mọi PR phải dựng baseline ở merge-base | `toHaveScreenshot` không ổn định (≈174–232 nghìn pixel khác, 1%) | Base đỏ chính test này ở `410d78d`, `6c7b888` (Visual regression, job `baseline`); PR #50 (`3476f4a`): lần 1 đỏ ở desktop-1440-light (bước so sánh), chạy lại đỏ ở desktop-1440-dark ngay bước dựng baseline tại merge-base (code base, run 39134430864) | Giảm nhờ PR #51 (baseline có sẵn + retry), còn flaky ở base — sửa gốc E14-S08 (ổn định trang chủ: animation/ảnh chưa tải). Base `8377735`: run 39710282562 đỏ desktop-1440-dark, chạy lại xanh; PR #52 `compare` dùng `Baseline restored from run 39710282562`, `/` qua cả 4 viewport (run 39723584741). PR #56: `compare` đỏ desktop-1440-light (≈174 nghìn px, run 39938175290, chạy lại xanh) và desktop-1440-dark (≈1,25 triệu px, 4%, run 39940707893); commit kế tiếp xanh |

## Baseline local và CI

Baseline/report/test output đều được `.gitignore`: **không commit ảnh hoặc report**. Baseline nằm tại
`__screenshots__/{platform}/{projectName}` (`win32` local, `linux` CI), vì font/render giữa Windows và Linux khác nhau.
So sánh phải dùng cùng OS/browser version; xem [hướng dẫn Playwright](https://playwright.dev/docs/test-snapshots).
Muốn chạy giống CI ở local, dùng Linux/WSL hoặc image `mcr.microsoft.com/playwright:v1.58.2-noble` với các lệnh trên.
Môi trường build cần cấu hình catalog mặc định; không dùng env local tắt catalog hoặc thay site mode.

CI `visual.yml`:

- Push có thay đổi liên quan vào `mono-repo-multi-tenent` hoặc dispatch trên branch này sinh artifact
  `visual-baseline` Linux, giữ 90 ngày. Sau thay đổi giao diện có chủ đích, merge được duyệt sẽ cập nhật artifact.
- PR chạm web/UI/sections/themes/tokens/harness/lockfile/workflow so với artifact push thành công gần nhất của base.
  Nếu base vừa đổi giao diện, PR cũ cần rebase. Check chưa được đặt required.
- Thiếu/hết hạn artifact: tạo worktree merge-base, cài/build bằng lockfile của base rồi chạy **harness PR** trên server
  của worktree để tạo baseline. Cách này hoạt động cả PR đầu tiên khi base chưa có `tooling/visual`.
  `VISUAL_WEB_ROOT` chỉ đổi thư mục server cho fallback CI, không đổi nguồn baseline sang app PR.
- PR thêm/đổi tên route hoặc thay đổi harness/browser khiến artifact cũ không tương thích: cần cập nhật baseline base
  có chủ đích; không tạo baseline từ app PR để tự cho qua thay đổi.
- Fail: artifact `visual-report` giữ 14 ngày, gồm HTML và test output. Tải artifact, mở `playwright-report/index.html`.

Không chỉnh `ci.yml` cũ trong story này. CI xanh và review độc lập do playbook xác nhận trên PR.

## Ma trận section

Mở `/lab/sections/matrix` (production cần `LAB_ENABLED=true`) hoặc
`/lab/sections/hero?themes=t15&variant=t15&lang=vi`. Route dùng defaults của schema và adapter collection mẫu;
theme/variant được đọc từ registry. Query bỏ id lạ, bỏ trùng; không còn lựa chọn hợp lệ thì hiển thị tất cả.
Trang demo `/lab/sections` vẫn dùng registry demo riêng.

```sh
pnpm turbo run build --filter=web
pnpm --filter @solar/visual matrix:update
pnpm --filter @solar/visual matrix:test
pnpm --filter @solar/visual matrix:report
```

`pnpm visual:matrix` build rồi so ma trận. Windows có thể dùng `VISUAL_WORKERS=2` và server riêng như hướng dẫn ở trên;
server riêng **phải bật `LAB_ENABLED=true`**. Tests lấy type/variant từ registry và cả 15 theme hiện có,
chạy ở 390/1440 × light/dark. Mỗi test chỉ render một type/theme; axe duyệt trang một lần cho các variant.
Setup kiểm registry thực tế trước mọi project. Project `matrix-*` có baseline riêng, không thay 48 ảnh cũ.
Thứ tự theme → type rải hero/calculator/segments vào các shard, tránh dồn mọi theme của section chậm vào một shard.
`matrix:update` lưu registry của source baseline vào `matrix-manifest.json`; so ảnh bắt buộc cho mọi ô trong manifest,
thiếu PNG làm fail. Chỉ ô không tồn tại trong registry exact-base được ghi `baseline-new`; màu token và axe vẫn kiểm.
`node tooling/visual/matrix-baseline.js <snapshot-directory>` kiểm đủ PNG của manifest ở cả bốn project.
Artifact cũ thiếu manifest hoặc snapshot được sinh lại từ exact-base, không từ app PR.
Matrix ẩn widget của shell nằm ngoài ô (`body > [data-widget]`) trước khi chụp, giữ widget bên trong ô.
Widget fixed theo viewport từng gây nhiễu trên ô dài khi Playwright cuộn/chụp. Manifest ghi
`capturePolicy: isolated-site-widgets`; cache dùng cơ chế chụp cũ bị từ chối để CI chụp exact-base bằng harness hiện tại.
Ngưỡng so ảnh vẫn 0,5%; không thay PNG baseline bằng ảnh của PR.

Computed-style kiểm RGB với sai số ±1 và mọi alpha; transparent hợp lệ. Duyệt phần tử hiển thị và pseudo-element,
kiểm màu chữ, nền/gradient, viền có width, outline, decoration, shadow, SVG fill/stroke. Dạng màu chưa hỗ trợ bị báo lỗi.
Chỉ SVG trong `packages/ui/brand-icons` có `data-brand-icon` được loại trừ theo AGENTS.md §4; pixel ảnh/video không phải CSS.
`@axe-core/playwright` 4.13.0 chỉ là devDependency để kiểm `color-contrast` (AC), phát hành 2026-08-11.

`matrix-report/index.html` hiển thị type/variant × theme/viewport/mode, số màu ngoài token, thời gian wall-clock từ
Playwright JSON reporter và node tương phản < AA. Đỏ = lỗi tương phản, cam = ngoài token, “Cần kiểm tra” = axe không
đánh giá được; không có violation không đồng nghĩa đã chứng nhận AA. Lỗi tương phản chỉ ghi report, màu ngoài token
và snapshot sai làm test fail. JSON từng ô ở `test-results/matrix/**/cells.json`, tổng lượt chạy ở `test-results/matrix-run.json`;
output được Playwright làm mới mỗi lượt để không lấy kết quả cũ. Report/baseline/output không commit.
CI chạy bốn project × tám shard độc lập, ngân sách sinh baseline/so ảnh mỗi shard vẫn 6 phút; fallback exact-base sinh đúng shard
trước so sánh. Legacy/lab và `test:sections` chạy trong job riêng để matrix không cắt mất coverage đó.
Mỗi shard upload report/JSON/trace 14 ngày kể cả khi fail. Report giữ partial cells và ghi “Lượt chạy bị ngắt” nếu
JSON reporter chưa hoàn tất; trạng thái test lỗi vẫn do Playwright/CI quyết định. Thời gian CI cần xác nhận trên PR.
Push base sinh matrix baseline theo cùng shard, gộp và kiểm đủ tập PNG rồi mới xuất artifact `matrix-baseline` 90 ngày.

## Thumbnail section (E7-S13)

Chạy web server với `LAB_ENABLED=true`, rồi `pnpm --filter @solar/visual thumbnails`.
Mặc định dùng `http://localhost:3000`; đặt `THUMBNAILS_BASE_URL` để đổi.
Script chụp 900px đầu từng cell ở viewport 1440px, xuất WebP 320×200 vào
`apps/admin/public/section-thumbs/<theme>/<type>--<variant>.webp` và cập nhật manifest của cms-ui.
Chạy lại sau khi thêm variant/theme. Có thể chụp một phần bằng `THUMBNAILS_TYPES=hero,projects`
và `THUMBNAILS_THEMES=t12,t15`; manifest chỉ khai báo file đã sinh. Test cms-ui kiểm đủ toàn bộ registry × theme.
