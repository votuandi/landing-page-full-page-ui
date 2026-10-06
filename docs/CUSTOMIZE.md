# Tùy chỉnh template-10

## Nơi sửa nội dung

Sửa **`src/content/site.ts`**. Tất cả trang đang hoạt động đọc thông tin hiển thị, tên khách hàng, nội dung, ảnh, CTA, SEO và hệ số từ file này. `src/config/site.ts` và `src/data/solar.ts` chỉ là các đường dẫn tương thích, không có bản dữ liệu độc lập.

| Nhóm dữ liệu | Cần thay |
|---|---|
| `SITE_CONFIG` | Tên pháp lý, tên thương hiệu, logo, favicon, URL, hotline, Zalo, email, địa chỉ. Tên Minwy Solar và hotline 0708699808 đã được chủ template xác nhận. Địa chỉ, mã số thuế và giấy phép để trống cho đến khi được cung cấp. |
| `NAV_ITEMS`, `COPY`, `CATALOG_COPY`, `ASSET_COPY` | Menu, nhãn trường, thông báo, các tiêu đề section và câu chữ dùng chung. |
| `HOME_COPY` | Thông điệp chung, ba lợi ích và CTA của hero khi chưa chọn tệp. |
| `SEGMENTS` | Nội dung, ba lợi ích trên hero, CTA, nỗi đau, giải pháp, con số, FAQ và meta riêng cho từng tệp. |
| `IMAGES` | Đường dẫn ảnh địa phương và alt tiếng Việt. Dùng ảnh có quyền sử dụng. |
| `CLIENTS` | Tên, ngành, địa điểm, quy mô, màu và mã logo hư cấu. Chỉ công bố tên/logo thật khi có quyền và quan hệ có thể xác minh. |
| `CASE_STUDIES` | Sáu hồ sơ mẫu: phân khúc, tỉnh, ngành, kWp, tiết kiệm, hoàn vốn, ảnh, lời nhận xét và cách triển khai. |
| `REVIEWS`, `COUNTERS` | Người chia sẻ, chức danh, đơn vị, avatar, lời chia sẻ và các số liệu năng lực. |
| `PARTNERS`, `TRUST_BADGES` | Logo placeholder và các điều kiện bảo hành, thiết bị, bảo hiểm, chứng nhận. |
| `FINANCE`, `PROCESS_STEPS` | Các phương án mua đứt/trả góp/ESCO và quy trình sáu bước. |
| `DASHBOARD` | Nhãn, giá trị, điểm vận hành và mảng sản lượng/tiêu thụ. Đây là giao diện tĩnh, chưa nối thiết bị. |
| `FAQS`, `ARTICLES`, `PRODUCTS` | FAQ chung, bài hướng dẫn, thiết bị demo, thông số, giá, bảo hành và tài liệu. |
| `CALCULATOR` | Toàn bộ hệ số và giới hạn máy tính; xem công thức bên dưới. |

Mỗi bộ khách hàng, dự án, nhận xét, thiết bị, tài chính, counter và hệ số có `isDemo: true`. Không đổi thành `false` chỉ để ẩn nhãn: hãy thay bằng dữ liệu đã xác minh và cập nhật các thông báo `COPY.demo`, `COPY.conditions`, `COPY.clientsNote`, `COPY.counterNote`. Nội dung về 0%, 0 đồng ESCO, 25 năm bảo hành là **điều kiện mẫu**, cần ghi điều kiện hợp đồng thực tế. Chính sách điện dư nằm ở `FAQS`, chưa tính doanh thu điện dư và không ghi số hiệu văn bản pháp luật.

## Ảnh và logo

- Thay 8 ảnh minh họa tại `public/images/template-10/` bằng ảnh công trình có quyền dùng: nhà máy, trang trại, cửa hàng, cà phê, nhà phố, khu dân cư, kỹ thuật viên, lưu trữ/inverter. Thay 3 avatar và ảnh đội ngũ bằng người đã đồng ý sử dụng hình ảnh.
- Ảnh dưới màn hình đầu dùng lazy-load qua `next/image`; ảnh hero dùng `priority`. Giữ WebP, cạnh dài tối đa 1920 px. Cập nhật alt đúng nội dung trong `IMAGES` và nguồn/điều kiện sử dụng trong `docs/IMAGE-CREDITS.md`.
- Thay `SITE_CONFIG.brand.logo` / `.favicon`. Logo minh họa khách hàng nằm ở `public/images/clients/{id}.svg`; sửa tên/màu trong `CLIENTS` rồi chạy `npm run logos`. Script chỉ ghi các file logo tương ứng, không xóa file cũ tự động.
- Khi cần logo khách hàng thật, thay nội dung SVG tại đường dẫn tương ứng. Tránh đổi `id` trừ khi cũng đổi tên file. Không dùng logo đối tác thật trước khi xác minh quan hệ.
- Các ô “Logo đối tác” chủ ý là placeholder trung tính. Muốn thay bằng ảnh logo, điền đường dẫn `logo` và tên/alt `label` trong `PARTNERS`; component tự hiển thị ảnh khi `logo` có giá trị.

## URL quảng cáo và loại khách hàng

| Tệp | Hero theo query | Trang chuyên biệt |
|---|---|---|
| Nhà máy / trang trại | `/?segment=factory` | `/giai-phap/nha-may` |
| Chuỗi cửa hàng | `/?segment=retail` | `/giai-phap/chuoi-cua-hang` |
| Gia đình | `/?segment=home` | `/giai-phap/ho-gia-dinh` |

Chọn tệp trên hero cập nhật query, giữ UTM và hash. Tải lại URL giữ lựa chọn; query không hợp lệ trở về thông điệp chung. Ba trang giải pháp có hero theo trang. Máy tính và form kế thừa tệp; người dùng vẫn có thể thay loại khách hàng trong form. CTA gọi/Zalo/khảo sát cố định chỉ xuất hiện dưới 768 px, có khoảng an toàn cho màn hình có tai thỏ.

Nếu đổi slug trang hoặc thiết bị, cập nhật `next.config.ts` để giữ redirect từ URL cũ. Các đường dẫn gốc `/service`, `/product`, `/news`, `/about-us`, `/contact-us` được giữ.

## Hệ số và công thức máy tính

Các hệ số là DEMO, không phải biểu giá chính thức. Đơn vị `electricityRate`: VNĐ/kWh; `costPerKwp`: VNĐ/kWp; `sunHours`: giờ nắng tương đương/ngày; `roofM2PerKwp`: m²/kWp; `co2KgPerKwh`: kg CO₂/kWh. `selfUse` và `targetSaving` là tỷ lệ từ 0 đến 1. `performanceRatio` đã gộp tổn thất hệ thống.

- Sản lượng tháng mỗi kWp = giờ nắng × số ngày/tháng × hiệu suất hệ thống.
- Theo hóa đơn: kWp = hóa đơn × tỷ lệ tiết kiệm mục tiêu / (giá điện × sản lượng tháng mỗi kWp × tỷ lệ tự dùng).
- Theo mái: kWp = diện tích mái / m² mái mỗi kWp.
- Công suất được giới hạn bởi `minKwp`/`maxKwp`. Theo hóa đơn, điện tự dùng không vượt lượng điện mua tương ứng; tiết kiệm không vượt hóa đơn nhập.
- Tiết kiệm tháng = điện tự dùng × giá điện bình quân. Theo mái, chưa có hóa đơn để giới hạn phụ tải; giao diện nêu rõ cần khảo sát.
- Tiết kiệm năm = tiết kiệm tháng × số tháng/năm. Đầu tư = kWp × suất đầu tư. Hoàn vốn đơn giản = đầu tư / (tiết kiệm năm − bảo trì năm). CO₂ chỉ tính theo lượng điện tự dùng.
- Chưa gồm lưu trữ, thuế, chi phí tài chính, thay thiết bị, suy giảm dài hạn hay bán điện dư. Hộ gia đình dùng giá bình quân demo, chưa mô phỏng từng bậc hóa đơn.

CTA “Nhận báo giá chi tiết” chuyển các đầu vào qua query (`segment`, `mode`, `value`, `region`). Trang liên hệ tính lại ở server; không tin kết quả tự truyền từ URL. Kết quả được điền vào textarea, người dùng xem/sửa trước khi gửi.

Chạy `npm test` sau khi đổi hệ số để kiểm tra các bất biến và giới hạn; bài kiểm tra dùng tỷ lệ `targetSaving` đang cấu hình.

## Kết nối nhận yêu cầu

Không cần dịch vụ ngoài để chạy bản demo. Khi chưa có `LEAD_WEBHOOK_URL`, `/api/lead` trả `mode: manual` và nội dung đã kiểm tra. Người dùng bấm **Sao chép nội dung**, mở Zalo Minwy Solar 0708699808, dán và tự bấm gửi. Không lưu dữ liệu, không gửi tự động, không đưa thông tin cá nhân vào URL Zalo. Trình duyệt không cho sao chép thì có thể chọn nội dung và sao chép thủ công.

Thiết lập phía server qua `.env.local` hoặc môi trường hosting:

```dotenv
NEXT_PUBLIC_SITE_URL=https://ten-mien-cua-ban.vn
NEXT_PUBLIC_DEMO_MODE=true
LEAD_WEBHOOK_URL=https://dich-vu-cua-ban.vn/nhan-yeu-cau
LEAD_WEBHOOK_TOKEN=token-bi-mat-phia-server
```

Webhook nhận POST JSON gồm `name`, `phone`, `email`, `company`, `segment`, `message`, `consent`, `submittedAt`; xác thực Bearer nếu có token. Chỉ dùng HTTPS. Server kiểm tra tên, số điện thoại, email, consent, tệp hợp lệ và giới hạn độ dài; timeout 10 giây. Lỗi gửi được thông báo và người dùng có thể thử lại. Không log nội dung cá nhân hoặc token. Tắt thông báo demo sau khi thay dữ liệu và xác minh quy trình thật; cập nhật `COPY.contact.demoNotice` cho đúng môi trường. Chủ template chưa cung cấp endpoint webhook; URL trống có chủ ý, không giả lập gửi thành công.

## Giao diện, chạy và xuất bản

Giữ Next.js 15 / React 19 / TypeScript / Tailwind của template-8. Màu xanh kỹ thuật, vàng nắng, nền kem, card kính và đường bo lớn được giữ. Đổi màu/khoảng cách trong `src/app/globals.css`, hoặc các preset trong nội dung nếu bổ sung giao diện thử theme. Giao diện thử đổi thương hiệu/theme cũ được bỏ để website của bên mua không có menu kỹ thuật dành cho người xây mẫu.

```bash
npm install
npm run dev -- --hostname 127.0.0.1
npm run typecheck
npm run lint
npm test
npm run build
npm run start -- --hostname 127.0.0.1
```

Repo gốc dùng `yarn.lock`; không thêm thư viện runtime mới. Có thể dùng `yarn install --frozen-lockfile`, `yarn build` theo quy trình hiện tại. Để triển khai hosting, chọn nhánh `template-10`, build Next.js tiêu chuẩn; nhiệm vụ này chỉ push nhánh, không tự triển khai website công khai.

SEO tự sinh title, description, Open Graph, canonical, sitemap, LocalBusiness và FAQPage từ dữ liệu. Thay URL, tên pháp lý, địa chỉ và các meta riêng trước khi public. Không thêm đánh giá sao hoặc số liệu năng lực vào schema khi chưa có cơ sở.

## Thông tin và ảnh đã xác nhận ngày 06/10/2026

Dùng thương hiệu **Minwy Solar**, điện thoại **0708699808** (hiển thị 0708 699 808), Zalo cùng số. Email giữ theo cấu hình trước đây. Không suy đoán địa chỉ hay loại hình pháp lý. Bộ 8 ảnh công trình/thiết bị và 3 avatar tạo trong phiên này được giữ làm ảnh minh họa chính thức của template theo yêu cầu chủ template, không bắt buộc thay bằng ảnh chụp thật. Vẫn ghi rõ ảnh do AI tạo và không dùng làm bằng chứng dự án/khách hàng có thật. Các case study, counter và testimonial tiếp tục có `isDemo: true` cho đến khi có số liệu xác minh.
