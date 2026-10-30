# Vận hành email gửi đi từ nền tảng

E11-S05 dùng **Resend HTTP**, dùng chung đường gửi cho email hệ thống và thông báo lead.
Không vận hành máy chủ SMTP; Amazon SES/SMTP nằm trong backlog. Gửi thay mặt tên miền khách thuộc E11-S06.

## 1. Xác minh tên miền nền tảng

1. Chọn tên miền hoặc tên miền con riêng cho thư hệ thống, ví dụ `mail.example.vn` (thay bằng tên miền bạn sở hữu).
   Thêm chính tên đó trong Resend → Domains và chọn vùng gửi. Không dùng tên miền tenant làm địa chỉ gửi.
2. Sao chép **đúng tên, loại, giá trị và độ ưu tiên** của bản ghi SPF/Return-Path (TXT và MX) và DKIM (TXT)
   do Resend hiển thị vào DNS. Giá trị phụ thuộc vùng/tên miền; không sao chép khóa DKIM từ ví dụ.
   Bản ghi MX này phục vụ Return-Path của Resend, không thay MX hộp thư Google Workspace/Zoho hiện có.
3. Chờ DNS lan truyền, bấm Verify, chỉ gửi khi Resend báo Verified. Kiểm tra bằng `nslookup -type=TXT <tên bản ghi>`
   và `nslookup -type=MX <tên Return-Path>` hoặc `dig`. DNS có giao diện tự thêm hậu tố: tránh lặp tên miền hai lần.
4. Chỉ có **một TXT bắt đầu bằng `v=spf1` ở mỗi tên DNS**. Nếu tên đó đã có SPF, hợp nhất các nguồn gửi vào một bản ghi;
   không thêm bản thứ hai. Dùng giá trị Resend cung cấp, kiểm tra giới hạn DNS lookup khi hợp nhất.
5. Thêm TXT DMARC tại `_dmarc.<tên miền gửi>`, khởi đầu `v=DMARC1; p=none; rua=mailto:dmarc@example.vn`.
   Thay địa chỉ báo cáo bằng hộp thư do bạn kiểm soát; xác nhận nhận được báo cáo tổng hợp. Nếu dùng miền nhận báo cáo
   khác, làm thêm xác minh nhận báo cáo theo nhà cung cấp. Kiểm tra cả chính sách DMARC kế thừa từ miền cha.
6. Sau khi các nguồn gửi hợp lệ đều có SPF/DKIM alignment và báo cáo ổn định, tăng dần sang `p=quarantine`, rồi
   `p=reject`. Kiểm tra các dịch vụ đang gửi từ cùng miền trước mỗi lần siết để tránh chặn thư hợp lệ.
7. Tắt open/click tracking cho thư xác thực trong Resend để link token không bị viết lại hoặc theo dõi click.

## 2. Cấu hình và triển khai

- Đặt `RESEND_API_KEY` (khóa chỉ có quyền gửi trên tên miền cần dùng) và `MAIL_FROM="Tên nền tảng <no-reply@mail.example.vn>"`
  trong secret của worker. Không commit `.env` hoặc API key. Worker cần `PLATFORM_DATABASE_URL` như bình thường.
- Web/admin dùng cùng cấu hình khi gửi thử hoặc gửi lead trực tiếp. `LEAD_EMAIL_FROM` tùy chọn ghi đè địa chỉ gửi **lead**;
  để trống thì dùng `MAIL_FROM`. Nếu đặt, địa chỉ này cũng phải thuộc miền nền tảng đã xác minh.
- Khởi động lại worker. Thiếu `RESEND_API_KEY`/`MAIL_FROM`: worker cảnh báo khi khởi động; `notify.*` chỉ ghi metadata
  và hoàn tất (không phát lại khi thêm cấu hình sau đó). `mail.send` retry đến khi link hết hạn hoặc job dead.
  Vì vậy phải cấu hình đủ trước khi bật worker production.
- Topic `mail.send`: mời thành viên (72 giờ), reset mật khẩu (1 giờ), magic link (15 phút) tính từ lúc tạo job.
  Job cũ quá hạn được bỏ qua và hoàn tất; người nhận cần yêu cầu link mới.
- Topic owner: `notify.plan-changed`, `notify.renewal`, `notify.suspended`, `notify.domain-warning`.
  Chỉ gửi owner đúng tenant có email và chưa disabled; tenant suspended vẫn nhận thông báo. E9-S05 sẽ phát hiện và tạo
  job cảnh báo tên miền; E11-S05 chỉ cung cấp đường gửi.

## 3. Kiểm tra Gmail và mail-tester (ngoài agent)

Nạp biến môi trường worker bằng cơ chế secret của môi trường vận hành rồi chạy ở thư mục gốc repo:

```sh
pnpm --filter worker exec tsx scripts/mail-test.ts dia-chi-nhan@mail-tester.com
pnpm --filter worker exec tsx scripts/mail-test.ts hop-thu-kiem-tra@gmail.com
```

Lấy địa chỉ nhận mới trên mail-tester trước khi chạy. Script gửi một thư mẫu cùng template lời mời hệ thống,
có text và HTML, mỗi lần một key riêng. Thư có nhãn `[DỮ LIỆU MẪU]`; link `example.com` dùng token mẫu, không đăng nhập được.
Script không kết nối DB nhưng vẫn kiểm tra bộ cấu hình worker lúc nạp env.

Mở kết quả mail-tester: cần **≥ 9/10**; kiểm SPF/DKIM/DMARC đều pass và tên miền gửi khớp alignment.
Ở Gmail, kiểm thư vào tab Chính và “Hiển thị thư gốc” để xem xác thực. Điểm mail-tester không tự bảo đảm vị trí
hộp thư Gmail; kiểm cả hai. Nếu link mẫu ảnh hưởng điểm nội dung, ghi rõ kết quả và kiểm thêm thư mời thật từ site thử nghiệm.
Lưu ngày kiểm, tên miền gửi, điểm và ảnh/link kết quả đã che dữ liệu nhạy cảm vào PR. Không tick AC trước khi có bằng chứng.

## 4. Retry và xử lý lỗi

Resend `Idempotency-Key` giữ **24 giờ**. Worker dùng `auth:<tokenId>` cho mail auth và `<jobKey>:<ownerId>` cho
từng owner; nội dung template không đọc đồng hồ hiện tại. Retry trong cửa sổ này cùng key/nội dung không gửi trùng.
Sau 24 giờ hoặc khi thay đổi nội dung/địa chỉ/cấu hình giữa các lượt retry, không có bảo đảm gửi đúng một lần;
tránh đổi cấu hình hoặc tên site khi đang xử lý job retry. Link hết hạn cần tạo yêu cầu mới.

400/401/403/409 và các 4xx khác trừ 408/429 là lỗi permanent (dead); 408/429/5xx/network/timeout hoặc thiếu cấu hình
thì retry theo backoff chung. Kiểm log `[outbox] dead`/audit bằng ID job và topic, không in payload, địa chỉ nhận,
URL chứa token, API key hay nội dung phản hồi Resend. Sửa cấu hình/provider trước khi yêu cầu link mới.
Khi `mail.send` done hoặc dead, payload được thay bằng `{ "redacted": true }` trong cùng thao tác ghi trạng thái,
có kiểm lease. Retry còn giữ payload để gửi tiếp. **Không gửi lại job auth đã redact**; tạo yêu cầu mới từ giao diện.
Lead và các topic khác giữ payload theo hợp đồng hiện có.

Nguồn vận hành: [Gửi email](https://resend.com/docs/api-reference/emails/send-email),
[Idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Xác minh tên miền](https://resend.com/docs/dashboard/domains/introduction),
[DMARC](https://resend.com/docs/dashboard/domains/dmarc).
