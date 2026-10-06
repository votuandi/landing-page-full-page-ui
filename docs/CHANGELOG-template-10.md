# Thay đổi template-10

Nguồn: nhánh `template-8` tại `aae653519a74e172675bd1c3cdcb2a92b77828e2`. Tất cả commit của nhiệm vụ nằm trên `template-10`; không sửa hoặc push các nhánh khác. Giữ Next.js 15.4.10, React 19, TypeScript, Tailwind 3.4 và cấu hình build hiện có. Không thêm thư viện runtime vào sản phẩm.

## Nội dung có thể thay qua một file

- `src/content/site.ts` chứa thương hiệu, liên hệ, menu, text chung, SEO, nội dung ba tệp, hình ảnh/alt, khách hàng, đối tác, sáu dự án, sáu nhận xét, bốn counter, ba phương án tài chính, sáu bước quy trình, chứng nhận mẫu, bài hướng dẫn, thiết bị và tham số máy tính.
- `src/config/site.ts` / `src/data/solar.ts` chỉ re-export để giữ đường dẫn tương thích. Xóa các component/hook legacy không được trang nào dùng, tránh còn một nguồn hardcode gây nhầm lẫn khi bán mẫu.
- Tên, lời nhận xét, số liệu, ảnh và điều kiện là demo, có `isDemo: true`, comment và thông báo trên UI. Không bổ sung số hiệu văn bản pháp luật. FAQ cơ chế điện dư dùng nội dung chung để bên mua tự cập nhật.
- Các nhãn trang, danh mục và thông báo đã Việt hóa. Các thuật ngữ thiết bị/kỹ thuật và tên đơn vị như kWp, CO₂, ESCO, ESG vẫn được giữ khi cần.

## Phân khúc và hành trình tư vấn

- Hero có thông điệp chung mặc định; chọn Nhà máy / Cửa hàng / Gia đình đổi headline, mô tả, ba lợi ích và CTA, cập nhật `?segment=factory|retail|home` và giữ UTM/hash.
- Ba trang Next App Router: `/giai-phap/nha-may`, `/giai-phap/chuoi-cua-hang`, `/giai-phap/ho-gia-dinh`. Cùng component UI và nội dung riêng: nỗi đau → giải pháp → lợi ích định lượng → hai case → tài chính → FAQ → CTA.
- Nhà máy: 20–40%, giờ cao điểm, mái mát hơn, ESCO 0 đồng, 4–6 năm, giảm phát thải/ESG. Chuỗi: tải ban ngày, giám sát tập trung, thí điểm/triển khai đồng bộ, một đầu mối, thương hiệu xanh. Gia đình: điện bậc thang, hybrid lưu trữ/dự phòng, 0%, theo dõi ứng dụng, hiệu suất tấm pin 25 năm.
- Mọi con số/lãi suất/thời hạn bảo hành đều có điều kiện demo. Không khẳng định hòa lưới thông thường tiếp tục chạy khi cúp điện hoặc bảo hành toàn hệ thống 25 năm.

## Social proof minh họa

- 11 SVG chữ + icon tự tạo, màu riêng, lưu `public/images/clients/`; tên theo kịch bản hư cấu được yêu cầu. Marquee có lọc ngành, nút dừng/tiếp tục, dừng hover/focus và hỗ trợ giảm chuyển động.
- Xóa bộ logo thương hiệu thật cũ tại `public/images/partners`. Tám ô “Logo đối tác” trung tính; `PARTNERS.logo` cho phép thay ảnh trực tiếp qua data.
- Sáu case, hai mỗi tệp: ảnh, ngành, tỉnh, kWp, % tiết kiệm, số năm hoàn vốn, lời nhận xét; mở trang `/project/[slug]` để đọc chi tiết và gửi nhu cầu tương tự. Chọn trang chi tiết thay modal vì App Router đã có cấu trúc dự án và trang riêng dễ chia sẻ/SEO hơn.
- Bốn counter tăng khi vào viewport; người dùng giảm chuyển động thấy số cuối. Carousel nhận xét có avatar hư cấu, tên/chức danh/đơn vị, lọc tệp và điều khiển trước/sau; không tự chuyển làm gián đoạn đọc.

## Công cụ chuyển đổi

- Máy tính ba tab; hóa đơn hoặc mái, ba vùng. Các hệ số nằm trong `CALCULATOR`. Xuất kWp, tiết kiệm tháng/năm, đầu tư, diện tích, hoàn vốn sau bảo trì và CO₂/năm; hiển thị giả định và câu “Kết quả mang tính tham khảo”.
- Giữ giá trị riêng theo tab/kiểu đầu vào, kiểm tra min/max/NaN, giới hạn tiết kiệm theo hóa đơn; tính theo mái có cảnh báo cần kiểm tra phụ tải. Không tính điện dư, lưu trữ, thuế, tài chính hoặc suy giảm dài hạn.
- CTA báo giá gửi đầu vào hợp lệ tới trang liên hệ; server tính lại và điền kết quả vào nhu cầu. Form có loại khách hàng kế thừa segment và người dùng được đổi lại.
- Tài chính so sánh bốn tiêu chí: vốn, sở hữu, lợi ích, đối tượng; sáu bước quy trình; monitoring SVG tĩnh trên nhà máy/chuỗi và trang chủ; bốn huy hiệu có phạm vi điều kiện.
- Mobile <768 px có Gọi điện / Zalo / Khảo sát miễn phí, hỗ trợ safe-area. Giữ danh mục thiết bị lọc/sắp xếp và yêu cầu báo giá chung qua dialog native (Esc, focus, backdrop).
- Lead API kiểm tra dữ liệu/consent, giới hạn độ dài, webhook HTTPS và timeout. Chưa có webhook báo rõ “chạy thử form demo”, không nói đã lưu hoặc đã chuyển yêu cầu. Form xử lý lỗi mạng, không log thông tin cá nhân.

## Thiết kế, hình ảnh và hiệu năng

- Giữ màu xanh kỹ thuật/vàng nắng, nền be/xanh nhạt, Inter tiếng Việt, card kính bo 28px và hero ảnh vòm. Nâng độ tương phản nhãn, khoảng cách, hierarchy và kích thước điều khiển tối thiểu 44px.
- Các section nội dung dùng chiều cao tự nhiên thay min-height 100svh toàn trang: ba hành trình có nhiều nội dung, ép full-screen làm tăng khoảng trống và thời gian cuộn. Hero vẫn có bố cục ảnh lớn/card nổi; giảm hotspot và reveal liên tục để thông điệp/CTA rõ và tránh trì hoãn nội dung đầu màn hình.
- Bỏ giao diện thử theme/thương hiệu cũ khỏi luồng người mua điện mặt trời; giữ design token CSS. Logo mark SVG mới hợp palette, có thể thay ở data.
- Dùng ảnh mới do imagegen tạo theo bảy prompt được cấp, thêm lưu trữ/inverter và chân dung hư cấu. Đây là phương án được người dùng cho phép khi có công cụ tạo ảnh, giúp đúng bối cảnh mái áp pin tại Việt Nam. Không có ảnh stock/hotlink trong bản này. 8 ảnh WebP cạnh dài ≤1600px, 3 avatar 240px. Ghi nguồn/điều kiện và prompt trong `IMAGE-CREDITS.md`.
- Dùng `next/image` responsive, lazy-load trừ hero; không tải video nặng từ template cũ. Chỉ WebP để tránh encode AVIF chậm trên lần tải đầu. Các trang giải pháp/dự án/bài hướng dẫn/thiết bị prerender với `generateStaticParams`.

## SEO và tương thích

- Title/description riêng ba tệp; canonical, Open Graph, Twitter card; LocalBusiness lấy từ công ty cấu hình; FAQPage tương ứng các câu hỏi hiển thị. JSON-LD escape ký tự `<`; không đưa review/rating demo vào schema.
- Sitemap gồm ba giải pháp, sáu case, thiết bị và bài hướng dẫn. Giữ `/service`, `/product`, `/about-us`, `/contact-us`, `/news`; redirect URL dịch vụ/thiết bị/dự án cũ sang điểm phù hợp.
- Catalog cũ có thương hiệu thật được thay bằng nhãn thiết bị trung tính. Bỏ schema Offer “InStock” demo; tài liệu kỹ thuật thiếu hiện trạng đang chờ cập nhật thay link `#` hoặc PDF không tồn tại.
- Tin tức cũ có biểu giá và nhận định pháp lý hardcode được thay bằng hướng dẫn chung, nội dung một nguồn để bên mua cập nhật.

## Kiểm tra và bàn giao

Xem kết quả cuối, giới hạn phép đo và ảnh responsive trong `QA-template-10.md`. Có `npm test` cho máy tính và `npm run logos` để tạo logo từ data. Hướng dẫn nội dung, ảnh, hệ số, query, webhook, SEO và chạy/build trong `CUSTOMIZE.md`.

Cần bên mua hoàn thiện trước khi dùng thật: thông tin công ty/nhận diện/liên hệ, dữ liệu công trình và năng lực, ảnh có quyền dùng, lời nhận xét có xác nhận, hồ sơ chứng nhận/bảo hiểm, thiết bị/tài liệu, điều kiện tài chính và dịch vụ webhook. Dashboard vẫn là mock tĩnh theo yêu cầu; chưa tích hợp thiết bị thật. Nhiệm vụ push code, không bao gồm deploy hosting hoặc kết nối tài khoản dịch vụ của bên mua.

## Cập nhật Minwy Solar ngày 06/10/2026

- Xác nhận tên thương hiệu Minwy Solar, hotline 0708699808 và Zalo cùng số; bỏ tên pháp lý, địa chỉ, mã số thuế và giấy phép mẫu chưa được cung cấp. Schema không xuất địa chỉ khi trống.
- Chốt bộ ảnh AI đã tạo trong phiên làm bộ ảnh minh họa sử dụng; cập nhật credits và hướng dẫn, giữ nhãn demo cho dự án và lời nhận xét hư cấu.
- Khi chưa có webhook, form tạo nội dung đã kiểm tra để người dùng sao chép và gửi qua Zalo; không thông báo đã gửi, không lưu lead, không đưa dữ liệu cá nhân vào URL. Clipboard bị chặn có thể sao chép thủ công.
- Tiếp tục hỗ trợ webhook HTTPS phía server khi được cung cấp endpoint/token. Không tự tạo địa chỉ dịch vụ nhận lead.

## Cập nhật chuyển đổi và bảng màu — 06/10/2026

- Thêm cụm liên hệ cố định toàn site: chat hướng dẫn nhanh, form khảo sát trong dialog, gọi điện, Zalo và Messenger. Mobile thu gọn và nằm trên thanh CTA, có safe area; desktop mở sẵn và có thể thu gọn.
- Chưa được cung cấp trang Messenger thật: nút có lựa chọn liên hệ Zalo/hotline, hỗ trợ `contact.messenger` để bật link m.me sau này. Chat hướng dẫn không giả lập nhân viên trực tuyến; mọi nội dung câu hỏi/đáp nằm trong data.
- Đổi bảng màu đồng bộ từ xanh dương/vàng/be sang xanh dương/xanh lá/xanh lá nhạt: hero, CTA, badge, counter, dashboard, logo và favicon. Giữ khung kính mờ, bo góc, typography và tech stack.
- Thêm ba hero lợi ích trên trang chủ theo thứ tự gia đình → cửa hàng → nhà máy, tham khảo ảnh lớn/thẻ kính/section toàn màn hình của template-8. Desktop tối thiểu 100svh; mobile chiều cao tự nhiên để không cắt nội dung. Ảnh local lazy-load, CTA theo tệp và reveal tôn trọng reduced motion.
- Dialog dùng ID riêng để không trùng aria-labelledby giữa form/chat và yêu cầu báo giá thiết bị.
