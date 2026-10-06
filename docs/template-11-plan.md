# Template 11 — kế hoạch và phạm vi

## Giai đoạn 0: khảo sát
- Nền: template-8, commit aae6535; nhánh mới local template-11. Không push.
- Next.js 15.4.10 / React 19 / TypeScript / Tailwind 3, một ứng dụng (không monorepo).
- Màu: src/app/globals.css, tailwind.config.ts, src/config/site.ts. Font gốc: Inter qua next/font/google.
- Dữ liệu cũ: src/data/solar.ts và src/config/site.ts. Giữ tương thích các trang con.
- Template-8: section 100vh, ảnh có hotspot, nhiều thẻ kính bo tròn. Template-10 (chỉ git show/diff): hero chọn phân khúc + ảnh lớn, bộ tính và CTA riêng.
- Template-11: bố cục biên tập, tiêu đề đánh số, thẻ góc vừa, hero thông điệp + mini-calculator; hành trình vấn đề → tính toán → giải pháp → bằng chứng → pháp lý → FAQ → liên hệ.

## Component
- Tái sử dụng LeadForm: giữ nguyên hàm submit, endpoint, field/payload và cách xử lý response.
- Tái sử dụng SiteShell / RFQ cho các trang thiết bị; thay hình thức header/footer.
- Tạo src/components/solar/: SolarHome, BillHero, PackageCalculator, YieldChart, SegmentComparison, ProjectEvidence, TrustLegal, SolarLogo, StickyContact.
- Dữ liệu: src/content/solar/types.ts + data.ts, chỉ adapter index.ts được import data. Component chỉ import adapter.
- Công thức thuần: src/lib/solar-calc.ts, không fetch/lưu trữ. Repo chưa có test runner; chạy kiểm chứng công thức bằng script Node dùng TypeScript compiler hiện có.

## File không được động vào
- src/app/api/** (hiện có src/app/api/lead/route.ts).
- Mọi route API/server action/controller/model/schema/migration/database/Prisma nếu xuất hiện.
- .env*, next.config.ts, middleware*, Dockerfile*, docker-compose.yml, scripts/safe-migrate-reset.ts, scripts/weekly-cron.js, .github/**, public/backup/**.
- src/components/LeadForm.tsx: logic gửi dữ liệu bất biến.
- src/components/RoiCalculator.tsx: lời gọi POST /api/lead cũ giữ nguyên; không dùng bộ tính này trong home mới.
- Không sửa/merge/rebase template-8 hay template-10.

## Kiểm tra mỗi giai đoạn
Chạy npm run lint và npm run build trước từng commit; ghi kết quả thực tế. Kiểm tra cuối: diff backend/API bằng hash, không lời gọi API mới, công thức mỗi gói, responsive 360/768/1280 và Lighthouse mobile nếu công cụ khả dụng.

## Dữ liệu verified: false
PVout toàn bộ 34 tỉnh là dữ liệu mô phỏng, không phải trích xuất đã xác minh. Giá thiết bị, giả định PR/tự dùng/giá điện, case study và đánh giá là mẫu. Legal để [CẦN XÁC MINH] nơi chưa chắc, không bịa số hiệu/mức phạt. Không đánh dấu xác minh trước khi chủ website kiểm chứng.

## Chờ backend
- Adapter getBrand/getPricing/getPvout/getAssumptions/getLegal/getProjects/getTestimonials: thay implementation bằng API khi có hợp đồng dữ liệu; giữ chữ ký.
- Form LeadForm đang POST /api/lead: cấu hình webhook/endpoint là việc backend, không sửa trong nhiệm vụ này.
- Không thêm endpoint lưu calculator, trả góp, báo giá, analytics hay CRM; toàn bộ state mới chỉ ở client.

## Đổi thương hiệu cho khách mới
Sửa brand qua lớp dữ liệu; nhập giá/gói/thiết bị/bảo hành và giả định; thay case study/ảnh/đánh giá bằng dữ liệu được phép sử dụng; chỉ điền link giấy phép thực của doanh nghiệp. Kiểm chứng pháp lý/PVout và cập nhật nguồn trước khi xuất bản. Logo lấy tên qua prop. Chi tiết font/màu/favicon và kết quả QA sẽ bổ sung ở giai đoạn tương ứng.

### QA giai đoạn 0
npm run lint: PASS (7 cảnh báo img có sẵn, 0 lỗi). npm run build: PASS. Không có thay đổi code ở giai đoạn này.

### QA giai đoạn 1
Lint PASS (7 cảnh báo cũ), build PASS. `node scripts/check-solar-calc.cjs` PASS: 12 gói, 34 tỉnh, thay giá, ranh giới dải hóa đơn và đầu vào không hợp lệ. Biểu đồ 12 tháng dùng hệ số mùa mẫu có tổng 12; mỗi tháng quy ước 30 ngày. PR là hệ số điều chỉnh demo; khi dùng PVOUT đã bao gồm tổn hao của nguồn thực cần kiểm tra để tránh tính tổn hao hai lần. Hoàn vốn đơn giản không gồm O&M, suy giảm, lãi vay, thu nhập điện dư. Trả góp mặc định không lãi chỉ là phép chia mô phỏng, không phải sản phẩm tín dụng.

### QA giai đoạn 2
Lint PASS (7 cảnh báo cũ), build PASS. Hero chia đôi + mini-calculator tính từ adapter, tiêu đề section đánh số, góc thẻ 6–12px, khoảng cách theo nội dung thay section 100vh. Bộ icon Heroicons outline thống nhất. Font Be Vietnam Pro 400/700 cho nội dung, Manrope 700 cho tiêu đề, tự host WOFF2 ~80KB tổng; có giấy phép OFL và kiểm tra cmap tiếng Việt. Font tiêu đề không preload, display swap. Header/footer sẽ đồng bộ màu và thương hiệu ở giai đoạn 5–7.

### QA giai đoạn 3
Lint PASS (7 cảnh báo cũ), build PASS, kiểm chứng công thức PASS. Bộ tính chọn dải hóa đơn/nhập tiền/kWh, tra 34 tỉnh, so sánh hòa lưới/hybrid, chi tiết mở bằng details, biểu đồ 12 tháng/hoàn vốn và bảng số liệu riêng từng gói. Tỉnh và gói chọn cập nhật trả góp 6–24 tháng. CTA Zalo là URL tĩnh theo contactSegment trong dữ liệu, không POST. Clipboard chỉ chạy khi bấm, có nội dung sao chép thủ công nếu quyền clipboard không khả dụng. State mới chỉ ở React, không localStorage hay analytics.

### QA giai đoạn 4
Lint PASS (7 cảnh báo cũ), build PASS, kiểm chứng công thức PASS. Ba tab phân khúc có bàn phím mũi tên/Home/End, SVG 24h kèm bảng và kiểu nét. Case study theo khung công suất/MWh/tiết kiệm/thiết bị/CO₂/doanh nghiệp, bộ lọc và tổng cộng đều tính từ adapter. Video chỉ mount sau khi bấm, preload none; chưa có video thật trong dữ liệu mẫu. Ảnh lazy-load. Hồ sơ không có lookupUrl được ẩn; demo không giả lập giấy phép. Cờ verified:false của legal chỉ có ghi chú nhỏ ở dev; nội dung [CẦN XÁC MINH] vẫn giữ để tránh tuyên bố pháp lý chưa kiểm chứng. Đánh giá hỗ trợ photo/sourceUrl nếu có; mẫu hiện không giả mạo người thật.

### QA giai đoạn 5
Lint PASS (7 cảnh báo cũ), build PASS. Meta sinh từ min giá và min hoàn vốn tại tỉnh mặc định, ghi rõ mô phỏng. FAQPage lấy đúng FAQ hiển thị, LocalBusiness lấy brand; không đưa địa chỉ placeholder vào schema. Escape ký tự `<` trong JSON-LD. Mobile có Gọi/Zalo Gia đình/Zalo Doanh nghiệp, safe-area và chừa khoảng cuối trang. Header/footer lấy thông tin qua adapter; RFQ và tham số rfq cũ giữ nguyên. Đường dẫn anchor nội dung chính/tính toán mỗi vị trí chỉ dùng một CTA; các link liên hệ tel/Zalo là lối tắt thiết yếu.

### QA giai đoạn 6
Lint PASS (7 cảnh báo cũ), build PASS. Token xanh lá/vàng/trắng đúng yêu cầu tại globals.css; Tailwind dùng các RGB token tương ứng để hỗ trợ opacity. Toàn bộ literal màu cũ trong JSX/TS frontend đã chuyển sang token, kể cả component legacy không dùng trên home. Mã màu literal chỉ còn ở định nghĩa token và metadata theme-color. Dark mode có token riêng và badge nền sáng giữ chữ xanh đậm. Không sửa logic/API của component legacy. Kiểm tra 360/768/1280 không tràn ngang; axe WCAG AA không có lỗi tương phản sau sửa. Bảng tổng mobile đã thêm tabIndex để cuộn bằng bàn phím. Kiểm tra đầy đủ và Lighthouse sau logo/favicon ở giai đoạn 7.

## Bàn giao giai đoạn 7
- Logo phương án 1: mặt trời và lá, SVG rõ ở 24px; component nhận `getBrand().name` qua prop, hỗ trợ full/mark/white. Ba phương án trong `docs/logo-options/`, áp dụng phương án 1.
- Chạy `node scripts/generate-solar-brand.cjs` để sinh lại logo SVG, favicon.svg, favicon.ico (16/32/48), favicon-32.png, apple-touch-icon.png (180, nền trắng có padding), icon-192.png, icon-512.png và site.webmanifest. Dùng Sharp có sẵn, không thêm dependency production. Metadata khai báo icon/manifest và theme-color primary.
- Chỉnh sửa cuối đồng bộ thương hiệu các trang con, đưa nội dung legacy qua `getLegacyContent`/`getCatalog`, sửa tương phản dark mode và title SVG để SSR/client khớp. Logic form và API cũ giữ nguyên.

### Danh sách chưa xác minh
| Nhóm | Mục `verified: false` | Cần kiểm chứng |
| --- | --- | --- |
| PVout | Toàn bộ 34 tỉnh | Lấy số liệu theo vị trí và cấu hình thực; nguồn hiện là trang Global Solar Atlas, số trong demo là mô phỏng |
| Assumptions | Toàn bộ bộ giả định | Giá điện, PR, tự dùng, hệ số mùa, CO₂, trả góp |
| Legal | process, penalty, surplus | Quy trình, mức phạt, điện dư; giữ `[CẦN XÁC MINH]` |
| Projects | factory, farm, shop, home | Công trình và kết quả đo thật; ảnh hiện là minh họa |
| Testimonials | operations, family | Đồng ý sử dụng nội dung, ảnh và nguồn đánh giá thật |

Giá/gói/thiết bị là dữ liệu mẫu, không phải báo giá thương mại. Hồ sơ giấy phép chưa có link thực nên không hiển thị giấy phép giả. Ghi chú nhỏ của cờ legal chỉ hiển thị dev; nhãn mô phỏng và placeholder trong nội dung vẫn hiển thị production.

### Cách đổi thương hiệu
1. Sửa `brand` trong `src/content/solar/data.ts`: tên, slogan, hotline theo nhóm, Zalo, email, địa chỉ, mạng xã hội và `licenses[].lookupUrl`. Không dùng số điện thoại/link mẫu cho khách thật. Đồng bộ dữ liệu legacy trong `src/data/solar.ts` nếu sử dụng trang sản phẩm/dịch vụ cũ.
2. Sửa pricing, assumptions, PVout, phân khúc, projects, testimonials, FAQ qua cùng lớp dữ liệu. Giữ liên kết packageId/provinceId của dự án. Thay một giá sẽ cập nhật calculator, chart, trả góp và meta tự động; chạy kiểm chứng công thức.
3. Màu quản lý trong `src/app/globals.css` và token RGB tương ứng; Tailwind tham chiếu token. Font local trong `src/app/fonts`, có giấy phép OFL; không cần gọi dịch vụ font bên ngoài.
4. Chạy lại script logo/favicon khi đổi tên hoặc biểu tượng. Component logo dùng tên động; SVG file sinh sẵn cần tái tạo. Thay hình/video được cấp quyền; video chỉ mount khi người dùng bấm.
5. Xác minh nội dung pháp lý/PVout và ghi nguồn cụ thể trước khi bật `verified: true`. Không nhập số hiệu văn bản nếu chưa kiểm chứng.

### Chờ backend — bổ sung hợp đồng dữ liệu
- Adapter còn cần kết nối: getBrand, getPricing, getPvout, getAssumptions, getLegal, getProjects, getTestimonials, getSegments, getCopy, getCatalog, getLegacyContent. Giữ API getter đồng bộ bằng snapshot/cache/provider được nạp bên ngoài UI; không đổi sang Promise trực tiếp khi chưa có lớp hydrate. Dữ liệu mới hiện hoàn toàn tĩnh.
- LeadForm và RoiCalculator cũ dùng endpoint `/api/lead` sẵn có. Không tạo form/endpoint mới; cấu hình webhook, CRM, lưu lead và kiểm chứng nghiệp vụ nằm ngoài phạm vi frontend này.
- Không có chức năng mới bị ép triển khai bằng backend. Calculator/trả góp/tra tỉnh không lưu hoặc gửi dữ liệu; nút sao chép chỉ hoạt động theo thao tác người dùng. RFQ cũ vẫn giữ localStorage và query như template-8.

### Lệnh kiểm tra
```sh
npm run lint
npm run build
node scripts/check-solar-calc.cjs
QA_NODE_MODULES=/path/to/qa/node_modules QA_CHROMIUM_PATH=/path/to/chromium node scripts/check-template-11.cjs
git diff template-8 --stat
git diff --check
```
QA bên ngoài cần playwright-core và @axe-core/playwright, không thêm vào dependency website. Báo cáo/screenshot nằm trong `docs/qa-template-11/`; form trong kiểm tra được intercept, không gửi lead thật. Lighthouse dùng build production local, mobile simulated throttling Chromium 131; điểm có thể khác khi triển khai hoặc thay nội dung.

### QA giai đoạn 7
- Lint PASS: 0 lỗi, 7 cảnh báo có sẵn (ảnh `<img>` và dependency useMemo legacy). Build production PASS.
- Kiểm chứng công thức PASS: 12 gói độc lập, 34 tỉnh, cập nhật giá, ranh giới hóa đơn, đầu vào không hợp lệ, trả góp. Nhãn cuối biểu đồ lấy dòng tiền năm cuối, cả khi chưa hoàn vốn trong thời hạn mô phỏng.
- Browser PASS: 360/768/1280px không tràn ngang; axe WCAG AA 0 vi phạm, kể cả dark mode; tab bàn phím, bộ lọc, tra tỉnh, tiền/kWh, slider 24 tháng, 4 biểu đồ của hai gói hoạt động. Các trang frontend cũ trả 200, 0 lỗi runtime/hydration.
- Form POST được mock và đối chiếu toàn bộ field + `source: home-bottom` với template-8. LeadForm byte-identical; fetch cũ của RoiCalculator byte-identical. Không gọi API mới từ component solar.
- Backend/API/env/next.config được đối chiếu byte/hash; không thay đổi. ICO đủ 16/32/48; PNG đúng kích thước; manifest đúng brand/theme. Không push, nhánh template-8/template-10 không sửa.

### Checklist hoàn thành
- [x] Diff không có backend/API/env/schema/server config.
- [x] Không API mới; cách gọi API và logic gửi form cũ giữ nguyên.
- [x] Build/lint pass; responsive 360/768/1280, bằng chứng ảnh trong thư mục QA.
- [x] Component mới lấy dữ liệu qua adapter, không viết cứng giá/sản lượng/hoàn vốn.
- [x] Từng gói có biểu đồ hoàn vốn độc lập và cập nhật theo giá.
- [x] Token thay màu cũ trong frontend; hero, section, thẻ, font và hành trình khác template-8/template-10.
- [x] Danh sách dữ liệu chưa xác minh, Chờ backend và hướng dẫn đổi thương hiệu đầy đủ.
- [x] Mỗi giai đoạn có commit riêng sau build/lint; chưa push remote.
- [x] Lighthouse mobile production local: **Performance 95 / Accessibility 100 / SEO 100**, vượt mục tiêu 85/95. Báo cáo chi tiết `docs/qa-template-11/lighthouse-mobile.json` và tóm tắt `lighthouse-scores.json`; không có run warning.
