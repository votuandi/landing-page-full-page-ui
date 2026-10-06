# Audit template-8 và kế hoạch template-10

Ngày kiểm tra: 06/10/2026. Nguồn: `template-8` tại `aae653519a74e172675bd1c3cdcb2a92b77828e2`. Tất cả thay đổi chỉ nằm trên `template-10`.

## Tech stack và cấu trúc
- Next.js 15.4.10, App Router, React 19, TypeScript strict, Tailwind 3.4, Heroicons. Không có CMS/database đang chạy cho các trang public.
- `src/app`: routing, metadata, sitemap, robots, API lead. `src/components`: UI; nhiều component cũ không còn được homepage dùng.
- `src/config/site.ts`: công ty, liên hệ, theme, một phần máy tính. `src/data/solar.ts`: thiết bị, dịch vụ, dự án, FAQ, nhân sự, testimonial.
- `src/utils/solar.ts`: metadata, tiền tệ, công thức ROI. `public/images`: JPG/WebP/SVG; `public/videos`: video cũ; `public/backup`: bản sao dữ liệu cũ.
- Design system: xanh #0d3b78, vàng #f7b928, be, xanh nhạt; thẻ bo 28px, glass/backdrop, hero ảnh vòm và hotspot, section tối thiểu 100svh, animation IntersectionObserver.

## Trang và section đang có
- `/`: HeroT8 → SavingsBySegment (3 nhóm) → RoiCalculator → EnergyMonitoringSection → dự án → quy trình 5 bước → đầu tư → bảo hành → chính sách → testimonial/thiết bị → FAQ → lead.
- `/about-us`, `/contact-us`, `/product` và `/product/[slug]`, `/service` và `/service/[slug]`, `/project/[slug]`, `/news` và `/news/[slug]`, trang 404.
- API `/api/lead`: chuyển webhook; không có webhook thì trả thành công demo, chưa lưu dữ liệu.

## Hardcode và rủi ro nội dung
- `HomeT8.tsx`: headline, quy trình, đầu tư, bảo hành, nhãn; `HeroT8.tsx`: headline, chip, số liệu giả Live.
- `SavingsBySegment.tsx`: lợi ích/hình/CTA 3 nhóm; `EnergyMonitoringSection.tsx`: dữ liệu biểu đồ/nhãn; `RoiCalculator.tsx`: input/nhãn/hệ số ngoài config.
- `SiteShell.tsx`: menu footer, nhãn, form RFQ và thanh CTA. `LeadForm.tsx`: nhãn và thông báo; thiếu loại khách hàng và xử lý lỗi mạng.
- About: timeline/chứng chỉ; tin tức: dữ liệu lặp giữa danh sách và chi tiết, có phát biểu giá điện/chính sách cũ; catalog có thương hiệu thực không được nhầm thành khách hàng/đối tác.
- Các component legacy có mảng riêng; một số logo doanh nghiệp thực tồn tại trong `public/images/partners`.

## Điểm yếu chuyển đổi
- Chưa có URL chạy quảng cáo theo tệp; CTA chưa phản ánh bài toán từng nhóm; chưa có trang chuyên biệt đủ hành trình nỗi đau → lợi ích → minh chứng → tài chính.
- Demo chưa được ghi rõ tại từng số liệu. Không có logo wall theo ngành, 6 case phân bổ đều, testimonial carousel có avatar.
- Máy tính chưa có đầu vào diện tích, CO₂ và chuyển kết quả sang form. Mobile báo giá thiết bị thay vì khảo sát; thiếu loại khách hàng.
- Nhãn tiếng Anh (Live, Case study, FAQ, catalog...) xen lẫn. Bảo hành/pháp lý cần điều kiện cụ thể và cấu hình dễ cập nhật.
- Section full-height quá nhiều khiến trang dài; giữ nhịp hình ảnh lớn nhưng dùng section nội dung tự cao khi cần.

## Baseline
- Cài dependencies bằng npm (không sửa lockfile).
- Chạy `next dev --hostname 127.0.0.1 --port 3001`: server báo Ready. Lệnh không chỉ định hostname gặp lỗi môi trường `uv_interface_addresses`.
- `npm run build`: exit 0, 29 trang, First Load JS trang chủ 114 kB; có warnings legacy (img, useMemo). Bản production trang chủ HTTP 200 và mở được bằng Chromium ở 360px.
- Lighthouse 13.5 mobile, localhost production: Accessibility 100, SEO 100; FCP 1,2s, LCP 2,6s, TBT 0ms, CLS 0. Performance tổng không hợp lệ vì lỗi môi trường thu filmstrip `NO_SCREENSHOTS` ở Speed Index; không báo điểm 0 như điểm đo hợp lệ. Bộ test cuối sẽ thử lại cấu hình Chromium phù hợp.

## Kế hoạch theo code thực tế
1. Tạo `src/content/site.ts` làm nguồn duy nhất: giữ compatibility exports cho module cũ; tập trung toàn bộ text các trang đang dùng, sản phẩm và tin hướng dẫn chung. Cờ isDemo và ghi chú thay dữ liệu.
2. Hero giữ ảnh vòm/hotspot, thêm selector/query param và context chia sẻ segment. Next App Router hỗ trợ 3 route `/giai-phap/[slug]`, metadata/schema phía server và cùng component giải pháp.
3. Client SVG tự vẽ, ngành filter + marquee dừng khi hover/focus và giảm chuyển động; 6 case + trang chi tiết; 4 counter quan sát cuộn; testimonial carousel lọc nhóm.
4. Máy tính hàm thuần: hóa đơn hoặc mái, vùng; giới hạn tự dùng theo phụ tải và diện tích, không tính bán điện dư. Lead nhận payload tóm tắt; tài chính 3 phương án, quy trình 6 bước, dashboard mẫu và huy hiệu có điều kiện.
5. Ảnh minh họa địa phương theo prompt được cấp; WebP ≤1920px, nguồn/điều kiện sử dụng và ảnh cần thay được ghi. Không hotlink hoặc gán ảnh minh họa là công trình thật.
6. Metadata riêng, OG, LocalBusiness/FAQ, sitemap, test tính toán và luồng quảng cáo → tính toán → form. Responsive 360/768/1280/1920, console/axe/Lighthouse production; docs CUSTOMIZE và CHANGELOG; commit theo bước và push một lần cuối.
