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

`preset-home.spec.ts` so PNG full page legacy với `/` ngay trong cùng test ở 390/1440, ngưỡng 0,5%.
Expected luôn lấy từ route legacy độc lập, không lấy từ trang mới. Mask chỉ marquee, iframe/video và counter;
không che section bị lệch. JPEG q15 (4 ảnh dưới 3 MB) lưu trong `docs/evidence/E4/t15/{legacy,preset}-{390,1440}.jpg` cho design pass.
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
pnpm --filter @solar/visual matrix:test
pnpm --filter @solar/visual matrix:report
```

`pnpm visual:matrix` build rồi so ma trận. Windows có thể dùng `VISUAL_WORKERS=2` và server riêng như hướng dẫn ở trên;
server riêng **phải bật `LAB_ENABLED=true`**. Hiện có 28 type × 1 theme t15 × 2 viewport × light/dark = 112 ô.
Mục tiêu ≥ 4 theme chờ E4; không dùng theme giả. Theme/variant mới tự xuất hiện; thêm type cần cập nhật `matrixTypes`
(test coverage báo thiếu/thừa). Project `matrix-*` có baseline riêng, không thay 48 ảnh cũ. Ô chưa có baseline (PR đầu,
theme/variant mới) không so ảnh — chỉ ghi annotation `baseline-missing`, màu token và axe vẫn kiểm; job `baseline`
trên base tạo ảnh sau merge. Ô có baseline vẫn so bình thường. Kiểm tra ảnh mới trước khi chấp nhận baseline.

Computed-style kiểm RGB với sai số ±1 và mọi alpha; transparent hợp lệ. Duyệt phần tử hiển thị và pseudo-element,
kiểm màu chữ, nền/gradient, viền có width, outline, decoration, shadow, SVG fill/stroke. Dạng màu chưa hỗ trợ bị báo lỗi.
Chỉ SVG trong `packages/ui/brand-icons` có `data-brand-icon` được loại trừ theo AGENTS.md §4; pixel ảnh/video không phải CSS.
`@axe-core/playwright` 4.13.0 chỉ là devDependency để kiểm `color-contrast` (AC), phát hành 2026-08-11.

`matrix-report/index.html` hiển thị type/variant × theme/viewport/mode, số màu ngoài token, thời gian wall-clock từ
Playwright JSON reporter và node tương phản < AA. Đỏ = lỗi tương phản, cam = ngoài token, “Cần kiểm tra” = axe không
đánh giá được; không có violation không đồng nghĩa đã chứng nhận AA. Lỗi tương phản chỉ ghi report, màu ngoài token
và snapshot sai làm test fail. JSON từng ô ở `test-results/matrix/**/cells.json`, tổng lượt chạy ở `test-results/matrix-run.json`;
output được Playwright làm mới mỗi lượt để không lấy kết quả cũ. Report/baseline/output không commit.
CI chạy matrix song song với timeout 6 phút và upload `matrix-report` 14 ngày kể cả khi test fail. Thời gian CI cần
xác nhận trên PR; timeout cấu hình chưa phải bằng chứng đạt AC thời gian.
