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
