/**
 * Mẫu Google Apps Script nhận lead từ website và ghi vào Google Sheet.
 * 1. Tạo Google Sheet → Tiện ích mở rộng → Apps Script → dán file này.
 * 2. Sửa SECRET cho khớp biến môi trường GOOGLE_SHEETS_SECRET.
 * 3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web;
 *    "Thực thi với tư cách": Tôi; "Ai có quyền truy cập": Bất kỳ ai.
 * 4. Copy URL ".../exec" vào biến GOOGLE_SHEETS_WEBAPP_URL.
 */
var SECRET = "doi-chuoi-bi-mat-nay";
var COLUMNS = ["submittedAt", "source", "segment", "name", "phone", "zalo", "email", "address", "message", "estimate"];

function doPost(e) {
  var data = JSON.parse((e.postData && e.postData.contents) || "{}");
  if (SECRET && data.secret !== SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
  }
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName("Leads") || book.insertSheet("Leads");
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  sheet.appendRow(COLUMNS.map(function (key) { return data[key] || ""; }));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
