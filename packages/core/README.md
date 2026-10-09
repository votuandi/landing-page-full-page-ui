# @solar/core

Logic nghiệp vụ TypeScript dùng chung cho section và API, không phụ thuộc React/Next và không có dependency runtime.
Package xuất source TS qua `@solar/core`; app Next.js cần khai báo `transpilePackages: ["@solar/core"]`.

Các export: dự toán (`calculateSolar`, `CalculatorParams`, biểu giá/kWh), giá, SĐT Việt Nam, giỏ báo giá,
định dạng số/tiền, phân khúc/slug URL và calculator bus. Hệ số dự toán do bên gọi truyền qua `CalculatorParams`;
core không chứa cấu hình hay nội dung của tenant. Các hàm DOM chỉ gọi trong trình duyệt, tôn trọng reduced motion.

- `pnpm --filter @solar/core typecheck`
- `pnpm --filter @solar/core lint`
- `pnpm --filter @solar/core test` — `node:test`, biên dịch CommonJS vào `.test-dist`, in coverage (Node 20+).
- `pnpm --filter @solar/core test:coverage` — phủ dòng tối thiểu 85%, loại test/fixture (Node ≥ 22.8, chạy ở CI).

Fixture test là [DỮ LIỆU MẪU], không dùng để xuất bản biểu giá. Lựa chọn test runner: ADR D15.
