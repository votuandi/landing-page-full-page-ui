# Kiểm tra template-10

Ngày: 06/10/2026. Kiểm tra bản **production** bằng `next start --hostname 127.0.0.1`, không dùng điểm đo từ dev server. Không có dependency runtime mới; Playwright, axe và Lighthouse được cài ngoài repo chỉ để kiểm tra.

## Build và chất lượng code

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | Thành công; 31 trang được sinh, First Load JS trang chủ ~126 kB |
| `npm run typecheck` | Thành công |
| `npm run lint` | Thành công, không lỗi hoặc warning ESLint |
| `npm test` | 70 trường hợp máy tính qua |
| `git diff --check` | Không lỗi khoảng trắng |
| Tệp nguồn nội dung | `src/content/site.ts`; các trang đang dùng không có mảng nội dung riêng |

[Log build](qa/build-output.txt). Bài kiểm tra máy tính bao phủ ba tệp × ba vùng × hai kiểu đầu vào, giá trị ngoài giới hạn/NaN/Infinity, giới hạn tiết kiệm theo hóa đơn, quan hệ sản lượng/hoàn vốn/CO₂ và key không hợp lệ.

## Responsive và luồng chức năng

14 trang × 4 kích thước **360, 768, 1280, 1920 px** = 56 lượt: trang chủ, ba giải pháp, dịch vụ, về chúng tôi, danh mục thiết bị, chi tiết thiết bị, ba chi tiết dự án đại diện, tin hướng dẫn, chi tiết bài và liên hệ. Mỗi lượt kiểm tra một H1, không tràn ngang, không có ảnh đã tải bị lỗi.

- Không lỗi console/pageerror; không request tài nguyên trả lỗi.
- 12 luồng qua: query theo ba tệp; chọn hero và tải lại; tính theo hóa đơn và điền sẵn; đổi loại khách hàng tại form; submit demo báo đúng chưa lưu; tính theo mái 600 m² → 100 kWp và điền sẵn; lọc ngành/dừng marquee; lọc và chuyển nhận xét; dialog báo giá thiết bị Esc/focus/điền sẵn; API từ chối payload thiếu/sai và JSON lỗi.
- axe WCAG 2 A/AA và 2.1 AA: **0 vi phạm** trên `/`, cả ba trang giải pháp, `/contact-us`, `/product`.
- Form được thử ở chế độ demo, không gọi webhook bên ngoài hoặc lưu dữ liệu người dùng. Kiểm tra lỗi JSON và dữ liệu phía server trả 400 có chủ đích; không tính là lỗi tài nguyên trang.

[Dữ liệu kiểm tra](qa/browser-results.json).

| Kích thước | Ảnh đầu màn hình |
|---|---|
| 360 px | [home-360.webp](screenshots/home-360.webp) |
| 768 px | [home-768.webp](screenshots/home-768.webp) |
| 1280 px | [home-1280.webp](screenshots/home-1280.webp) |
| 1920 px | [home-1920.webp](screenshots/home-1920.webp) |

## Lighthouse mobile

Lighthouse **13.5.0**, Headless Chromium **131.0.6778.0**, cấu hình mobile mặc định (throttling mô phỏng), localhost production. Chrome chạy nhiều process, SwiftShader; không dùng `--single-process`. Điểm sau đây có filmstrip và Speed Index hợp lệ, không có run warning.

| Trang | Performance | Accessibility | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Trang chủ | **93** | **100** | **100** | 3,24 s | 26,5 ms | 0 |
| Nhà máy | **93** | **100** | **100** | 3,17 s | 56 ms | 0 |
| Chuỗi cửa hàng | **93** | **100** | **100** | 3,16 s | 51,5 ms | 0 |
| Hộ gia đình | **93** | **100** | **100** | 3,16 s | 27 ms | 0 |

Đạt mục tiêu P ≥85, A ≥90, SEO ≥95 trên cả bốn URL đo. FCP/Speed Index khoảng 1,36–1,37s. Đây là phép đo local; đo lại sau khi bên mua thay ảnh/nội dung và triển khai hosting vì mạng, máy chủ, cache và script ngoài có thể thay đổi kết quả.

Báo cáo gốc: [Trang chủ](qa/lighthouse-home.json) · [Nhà máy](qa/lighthouse-factory.json) · [Chuỗi](qa/lighthouse-retail.json) · [Gia đình](qa/lighthouse-family.json).

Baseline template-8: A100, SEO100, nhưng Performance không có điểm hợp lệ vì Chromium không thu filmstrip (`NO_SCREENSHOTS`). Bản thử chạy Chrome 153/131 với `--single-process` cũng gặp cùng lỗi. Bỏ single process giải quyết thu filmstrip ở lần cuối. Không so sánh điểm Performance với một baseline không hợp lệ. [Baseline JSON](qa/lighthouse-baseline.json).

## Chạy lại

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Có script tùy chọn `scripts/check-browser.cjs` để chạy responsive/flows/axe/Lighthouse và lưu bằng chứng vào `.qa-results/` (đã ignore). Chuẩn bị Chrome/Chromium trên máy và các công cụ QA bên ngoài repo:

```bash
npm install --prefix /tmp/template10-qa --no-save playwright @axe-core/playwright lighthouse
QA_NODE_MODULES=/tmp/template10-qa/node_modules \
QA_CHROMIUM_PATH=/duong/dan/toi/chrome \
node scripts/check-browser.cjs
```

Chạy từ thư mục repo, sau build. Cần port 3010 và 9222 trống. `QA_CHROMIUM_PATH` là đường dẫn executable thực tế trên máy; không dùng nguyên placeholder. Script tự chạy production server và ép webhook rỗng để submit luôn là demo, sau đó dừng server/Chrome. Có thể chọn thư mục bằng `QA_OUTPUT_DIR`. Khi sửa các tên/slug trong nội dung, cập nhật các fixture/selector của bài kiểm tra browser tương ứng. Công cụ này không phải dependency của website.

## Cần hoàn thiện cho doanh nghiệp thật

Không có ảnh công trình hoặc khách hàng thật trong bản giao; tám ảnh công trình/thiết bị và ba avatar hiện là ảnh tạo mới minh họa. Logo khách hàng hư cấu, tám logo đối tác là placeholder; số liệu, testimonial, chứng nhận và điều kiện tài chính chưa được xác minh. Webhook cần cấu hình để nhận lead thật. Dashboard là mock tĩnh, chưa nối thiết bị thật. Xem `CUSTOMIZE.md` và `IMAGE-CREDITS.md`.
