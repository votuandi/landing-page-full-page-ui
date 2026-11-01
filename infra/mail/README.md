# Vận hành email gửi đi từ nền tảng

E11-S05 dùng **Resend HTTP**, dùng chung đường gửi cho email hệ thống và thông báo lead.
Không vận hành máy chủ SMTP; Amazon SES/SMTP nằm trong backlog. E11-S06 bổ sung sender tên miền khách cho thông báo lead.

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

- Đặt `RESEND_API_KEY` (`sending_access`, không giới hạn một miền nếu bật tên miền gửi của khách) và `MAIL_FROM="Tên nền tảng <no-reply@mail.example.vn>"`
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

## 5. Gửi thông báo lead thay mặt tên miền khách (E11-S06)

- Chỉ admin nhận `RESEND_DOMAINS_API_KEY` với quyền `full_access`; không cấp khóa quản lý này cho worker/web/console.
  Khóa gửi `RESEND_API_KEY` của worker và admin dùng `sending_access` không gắn `domain_id`, trên cùng tài khoản Resend.
  Khóa gửi bị khóa vào miền nền tảng sẽ làm email tên miền khách bị 403 và tự hạ trạng thái sang `failed`.
- Tenant có entitlement `senderDomain` (mặc định gói Cao cấp), quyền `email.manage`, mở `/cai-dat/ten-mien-gui`, nhập
  tên miền công ty quản lý. Mỗi tenant một miền; hostname duy nhất toàn nền tảng. IP, miền nền tảng và các miền con bị cấm.
- Thêm đúng bản ghi DNS hiển thị, gồm MX priority. Áp dụng quy tắc SPF/DKIM/DMARC ở mục 1; không thay MX hộp thư hiện có.
  Nền tảng không đặt `tracking_subdomain` nên Resend không áp dụng open/click tracking. Bấm Kiểm tra để yêu cầu Resend verify rồi đọc lại trạng thái; xác minh là bất đồng bộ,
  trạng thái chờ cần bấm lại sau khi DNS lan truyền. Chỉ đúng `verified` mới được gửi; `temporary_failure` về `pending`.
- Lead chọn sender tại thời điểm gửi (kể cả Gửi thử), kiểm lại trạng thái tenant, gói và kill switch. Hạ gói không xóa xác minh;
  nâng lại dùng tiếp. Chưa xác minh/hết trial/suspended/feature tắt dùng miền nền tảng. Thư hệ thống vẫn dùng `MAIL_FROM`.
- Địa chỉ là `"Tên công ty đã lọc" <no-reply@hostname>`. Key tên miền khách là `<leadId>:<integrationId>:<hostname>`;
  lỗi permanent từ miền khách thử lại bằng miền nền tảng với key gốc trong cùng lượt. 403 còn đánh dấu `failed` và ghi audit;
  422 chỉ fallback. 408/429/5xx/network giữ retry, không tự đổi sender. Callback demote lỗi không chặn gửi fallback.
- Xóa miền: xóa tại Resend trước (404 coi như đã xóa), sau đó xóa hàng tenant và ghi audit. Hàng kẹt chưa có provider id
  có thể xóa rồi thêm lại. DNS/provider lỗi hiển thị thông báo chung, không ghi khóa hay response body.
- Sao lưu tenant không chứa tên miền gửi: hostname và provider id không được sao chép sang tenant khác.
- Kiểm thật (người vận hành): dùng miền thử có DNS do mình quản lý, thêm và xác minh, Gửi thử tới hộp thư kiểm tra;
  xem From và SPF/DKIM/DMARC. Sau đó thử pending, hạ gói và thu hồi miền để xác nhận fallback. Unit dùng mock,
  integration kiểm RLS/DB, không chứng minh DNS hay deliverability thật. Xóa miền thử khi xong.
- Backlog: webhook đồng bộ trạng thái, dọn domain khi xóa tenant, thu hồi hostname giữ chỗ chưa xác minh, nhiều miền mỗi tenant.

API chính thức: [Domains](https://resend.com/docs/api-reference/domains/create-domain),
[Retrieve](https://resend.com/docs/api-reference/domains/get-domain),
[Quyền API key](https://resend.com/docs/api-reference/api-keys/create-api-key).
