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

Giỏ báo giá dùng chung (E3-S06): quoteCartStore là API trình duyệt không phụ thuộc React.
QUOTE_CART_KEY = "t15-quote-cart"; readQuoteCart() làm sạch dữ liệu, addToQuoteCart(sku, qty = 1)
cộng số lượng bằng addItem(), writeQuoteCart(lines) dùng cho sửa/xóa giỏ. Đọc/ghi localStorage
bọc try/catch, fallback bộ nhớ trong trang; gọi trên server không lưu trạng thái.

onQuoteCartChange(handler) nghe "t15:quote-cart-change"; openQuoteCart()/onOpenQuoteCart(handler)
dùng "t15:open-quote-cart". Hai listener trả hàm unsubscribe. Mọi nơi sửa giỏ phải qua store
để drawer và section đọc cùng dữ liệu, kể cả khi storage bị chặn.
