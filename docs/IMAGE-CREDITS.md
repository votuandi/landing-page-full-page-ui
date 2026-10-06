# Nguồn ảnh template-10

Tất cả ảnh đang hiển thị được tạo mới bằng OpenAI imagegen ngày 06/10/2026 theo các prompt dưới đây; không phải ảnh công trình hay khách hàng thật. Chọn ảnh tạo mới vì cần minh họa bối cảnh Việt Nam và mái có pin đúng kịch bản. Không có ảnh hotlink hoặc ảnh stock tải về trong bản này.

Điều kiện sử dụng đầu ra: [OpenAI Terms of Use – Content](https://openai.com/policies/row-terms-of-use/) và thỏa thuận của tài khoản tạo ảnh. Điều khoản nêu người dùng sở hữu đầu ra giữa họ và OpenAI trong phạm vi luật cho phép. Đây không phải giấy phép Unsplash/Pexels hoặc tuyên bố ảnh thuộc public domain. Bản ghi này ghi nguồn tạo ảnh, không chứng minh công trình hoặc con người tồn tại thật.

| File tại `public/images/template-10/` | Nguồn | Điều kiện | Vai trò |
|---|---|---|---|
| factory.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| farm.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| retail.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| coffee.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| home.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| neighborhood.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| technicians.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| storage.webp | OpenAI imagegen, 06/10/2026 | Đầu ra theo điều khoản OpenAI ở trên | Ảnh minh họa AI được chủ template chọn sử dụng |
| avatar-factory.webp / avatar-retail.webp / avatar-home.webp | Cắt từ một ảnh chân dung hư cấu do imagegen tạo | Đầu ra theo điều khoản OpenAI ở trên | Không phải khách hàng thật |

Các ảnh công trình/thiết bị được chuyển WebP (quality 79), cạnh dài không vượt 1600 px; avatar 240 × 240 px. Toàn bộ file nằm trong repo. `next/image` tạo các kích thước responsive, lazy-load mọi ảnh dưới màn hình đầu; ảnh hero được ưu tiên tải. Alt tiếng Việt nằm trong `src/content/site.ts`.

11 logo ở `public/images/clients/` là SVG tự tạo bằng chữ + hình đơn giản và màu riêng qua `scripts/generate-client-logos.cjs`; không sao chép nhận diện thương hiệu thật. Tên chỉ dùng làm tên hư cấu trong kịch bản này, không xác nhận một doanh nghiệp cùng tên ngoài đời là khách hàng. Biểu tượng công ty `public/brand-mark.svg` tự vẽ bằng SVG, giữ màu xanh/vàng của template-8; favicon kế thừa template-8. Cần thay nhận diện của bên mua.

## Prompt nguồn

1. **factory**: Aerial drone photo of a large fertilizer factory in southern Vietnam, rows of solar panels covering the metal roofs, bright sunny day, realistic, wide angle

2. **farm**: Industrial poultry farm in rural Vietnam, long chicken barns with solar panels on the roofs, green rice fields around, golden hour, photorealistic

3. **retail**: Modern Vietnamese convenience store in a city street, solar panels on the rooftop, warm evening lights, realistic photography

4. **coffee**: Cozy coffee shop in Ho Chi Minh City with rooftop solar panels visible, people sitting outside, natural daylight, photorealistic

5. **home**: Vietnamese tube house (nhà phố) with rooftop solar panels, blue sky, residential street, realistic

6. **neighborhood**: Residential neighborhood in Vietnam from above, many houses with rooftop solar panels, drone shot, sunny

7. **technicians**: Technicians in safety gear installing solar panels on a factory roof in Vietnam, documentary style photo

8. **storage**: Photorealistic unbranded inverter and lithium home battery storage in a tidy Vietnamese house utility room, no text, no logos.

9. **avatars**: Three separate equally spaced head and shoulders portrait photographs in a single horizontal strip of fictional Vietnamese solar customers: middle aged man in work shirt, woman retail operations manager, man home owner in casual polo. Neutral backgrounds, friendly natural expressions. Not real people or celebrities. No lettering or branding. Each occupies exactly one third of the strip, suitable for cutting three avatars.



## Lựa chọn sử dụng của chủ template

Ngày 06/10/2026, chủ template yêu cầu dùng bộ ảnh tạo trong phiên này cho Minwy Solar. Các ảnh trên đã được liên kết tại `src/content/site.ts`, được lưu local và là bộ ảnh sử dụng của template; không cần tạo lại hoặc tải từ nguồn khác. Có thể tiếp tục dùng làm minh họa. Avatar không xác nhận người thật và case study vẫn là dữ liệu demo.
