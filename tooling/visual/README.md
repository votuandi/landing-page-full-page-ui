# Hồi quy ảnh t15

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
