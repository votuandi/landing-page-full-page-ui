# @solar/themes

Các theme đã kiểm tra bằng `parseTheme()` của `@solar/tokens`.
`t15/theme.ts` giữ màu light/dark và token của Fresh Energy (template-15).

```ts
import { t15 } from "@solar/themes";
import { themeToCss } from "@solar/tokens";

const css = themeToCss(t15);
```

App inline CSS của đúng theme vào `<head>`; package tokens không phụ thuộc themes.
Fixture t15 trong tokens giữ độc lập để kiểm tra dữ liệu chuẩn, tránh vòng phụ thuộc.
Trang `/lab/themes` thuộc E2-S07.

## Font

Danh sách được phép: Inter, Be Vietnam Pro, Manrope, Plus Jakarta Sans và Montserrat.
`themeFontFamilies(theme)` bỏ trùng họ sans/display; `themeFontFiles(theme)` chọn đúng file theo weight;
`themeFontCss(theme, baseUrl = "/fonts/")` sinh font-face, fallback Arial có metric và biến sans/display.
Font hoặc weight ngoài danh sách bị từ chối. `font.source` được giữ để tương thích schema.

Mỗi trang dùng tối đa **2 họ / 4 file woff2**. Be Vietnam Pro có 3 file static (400/600/800);
các họ còn lại dùng một file variable/họ (Manrope và Plus Jakarta Sans: 200–800; Inter và Montserrat: 100–900).
Mỗi file gộp latin + vietnamese, dùng `font-display: swap`, tên có hash SHA-256 và được phục vụ tại
`apps/web/public/fonts` với cache bất biến. Giấy phép OFL đi kèm từng họ.

Không dùng `next/font`: preload của Next gắn với module layout/page import font, nên import mọi họ trong root layout
sẽ preload cả font của theme khác. Layout dùng `react-dom/preload` với đúng kết quả `themeFontFiles(theme)`.
API thuần không phụ thuộc Next; app khác có thể dùng `baseUrl` là đường dẫn thư mục tuyệt đối và chép cùng asset.

Để thêm font, sửa `FAMILIES` trong `scripts/build-fonts.py` rồi dựng lại từ gốc repo:

```sh
pip install fonttools brotli
python packages/themes/scripts/build-fonts.py
pnpm --filter @solar/themes test
```

Script tải TTF/OFL từ commit ghim của [google/fonts](https://github.com/google/fonts), subset bằng fonttools,
kiểm glyph `ạ ư đ Ă ơ ễ` trong nguồn và woff2, rồi sinh `src/fonts.generated.ts`.
Không sửa tay registry sinh tự động. Muốn cập nhật nguồn, đổi commit trong `SOURCE`, dựng lại và bỏ các asset hash cũ
sau khi xác nhận registry mới. Công cụ Python chỉ dùng lúc phát triển; runtime không tải Google Fonts.

Kiểm tra: `pnpm --filter @solar/themes typecheck`, `pnpm --filter @solar/themes lint`,
`pnpm --filter @solar/themes test`.
Test dùng TypeScript đã có để nạp các workspace package xuất source trên Node 20.
