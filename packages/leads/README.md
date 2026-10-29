# @solar/leads

Kênh nhận lead dùng chung cho web, worker và admin. Admin `/cai-dat/kenh-nhan-lead` cần `settings.manage`.
Cấu hình lưu bằng AES-GCM, AAD gồm tenantId + integrationId; dùng chung key ring `APP_ENCRYPTION_KEY` với tác vụ xoay khóa.
Không trả cấu hình đã giải mã về client. Khóa ký webhook sinh 32 byte và chỉ hiển thị khi tạo; sửa giữ khóa cũ.

| Kênh | Biến nền tảng | Cấu hình tenant | Idempotency |
|---|---|---|---|
| Email qua Resend HTTP | RESEND_API_KEY, LEAD_EMAIL_FROM | 1–5 địa chỉ nhận | Resend `Idempotency-Key`, trong cửa sổ lưu key của dịch vụ |
| Telegram | TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME | chat id | Ít nhất một lần |
| Webhook | APP_ENCRYPTION_KEY | URL HTTPS | Ít nhất một lần; receiver tự dedupe qua X-Solar-Idempotency-Key |
| Google Sheets | APP_ENCRYPTION_KEY | URL Apps Script /exec, secret | Ít nhất một lần; script mẫu hiện có không dedupe |

Webhook/Sheets cần entitlement `leadWebhook` (gói Nâng cao trở lên) ở admin và API intake trước tạo outbox.
Webhook gửi raw JSON; kiểm chữ ký `sha256=hex(HMAC-SHA256(secret, timestamp + "." + rawBody))` với header
`X-Solar-Timestamp`; receiver nên giới hạn độ lệch timestamp và so sánh constant-time. Key giao nhận là `leadId:integrationId`.
Single-site tiếp tục đọc env cũ; `LEAD_WEBHOOK_TOKEN` giữ header Bearer và đồng thời dùng làm khóa ký HMAC.

URL tenant chỉ HTTPS/443, không credentials. Guard kiểm mọi IP DNS, chặn dải private/reserved, IPv6 chỉ global unicast,
lookup của kết nối trả chính IP đã kiểm (bao gồm Node autoSelectFamily). Không theo redirect webhook.
Sheets chỉ theo một 302 tới `script.googleusercontent.com` bằng GET và kiểm lại guard. Timeout 10 giây, phản hồi tối đa 64 KiB.
Host cố định Telegram/Resend dùng fetch timeout 10 giây, không theo redirect và hủy response body sau nhận status.
4xx trừ 408/429, cấu hình hỏng, SSRF là permanent; timeout/network/5xx/thiếu env là retry. Lỗi không ghi URL/token/provider body.

Chạy `pnpm --filter @solar/leads test`, `typecheck`, `lint`.
