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

## Kiểm tra cập nhật Minwy Solar — 06/10/2026

- Build 31 trang, lint, typecheck và 70 trường hợp máy tính đều đạt.
- Form nhận yêu cầu khi webhook trống: tạo nội dung để khách tự gửi Zalo; sao chép thành công ở 360/768/1280/1920 px, không tràn ngang.
- Clipboard bị chặn có hướng dẫn chọn và sao chép thủ công; link Zalo chỉ chứa số 0708699808, không chứa thông tin khách.
- API trả nội dung đã kiểm tra với `Cache-Control: no-store`; từ chối thiếu consent. Không lưu hoặc tự gửi dữ liệu ở chế độ manual.
- Schema ghi đúng Minwy Solar và hotline; không xuất địa chỉ giả. Ảnh hero dùng bộ ảnh đã tạo và lưu trong repo.
- Không lỗi console; axe WCAG 2 A/AA và 2.1 AA không có vi phạm trên form sau khi tạo nội dung.
- Kết quả chi tiết: `docs/qa/minwy-handoff.json`. Lighthouse bên trên thuộc bản kiểm tra ban đầu; không chạy lại vì cập nhật chỉ ảnh hưởng thông tin công ty và luồng form.
- Chưa kiểm tra nhận yêu cầu qua webhook thực tế vì chủ template chưa cung cấp endpoint/token. Chưa gửi tin nhắn Zalo cho người khác; khách tự bấm gửi.

## Kiểm tra cụm liên hệ, hero lợi ích và bảng màu — 06/10/2026

- Build 31 trang, lint, typecheck, 70 trường hợp máy tính và diff whitespace đều đạt. Trang chủ first-load JS 128 kB; không thêm dependency.
- Responsive 360/768/1280/1920: ba section ảnh tải đúng, không tràn ngang; đủ 5 hành động cố định, vị trí mobile nằm trên thanh CTA, form gửi theo luồng Zalo đạt.
- 8 luồng đã kiểm tra: chat hướng dẫn → form, form manual, Escape, tự chọn tệp, Messenger thiếu link có Zalo/hotline, CTA gia đình đồng bộ máy tính, CTA nhà máy đồng bộ form, reduced motion.
- Không lỗi console. Axe WCAG 2 A/AA và 2.1 AA: 0 vi phạm ở chat mobile, trang chủ, liên hệ, nhà máy và sản phẩm.
- Lighthouse mobile trang chủ sau cập nhật: **Performance 92 / Accessibility 100 / SEO 100**, không run warning. Tóm tắt thông số đo ở `docs/qa/lighthouse-conversion-home.json`; kết quả luồng ở `docs/qa/conversion-upgrade.json`.
- 6 ảnh chụp ở `docs/screenshots/benefit-{home,retail,factory}-{360,1280}.webp`; ảnh 360 là viewport, ảnh 1280 là toàn section.
- Chưa có trang Messenger thật nên chưa kiểm tra gửi qua Facebook. Nút chuyển kênh tạm thời; Zalo/hotline đã kiểm tra đường dẫn, không tự gửi tin nhắn trong QA.
