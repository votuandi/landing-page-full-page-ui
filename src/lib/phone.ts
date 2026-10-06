/** Chuẩn hóa số điện thoại VN: bỏ khoảng trắng/dấu, +84/84 → 0. */
export function normalizeVnPhone(input: string) {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("84") && digits.length === 11) digits = "0" + digits.slice(2);
  return digits.replace(/\D/g, "");
}

/** Đầu số di động VN (10 số): 03x, 05x, 07x, 08x, 09x theo các nhà mạng hiện hành. */
const VN_MOBILE = /^0(3[2-9]|5[2589]|7[06-9]|8[1-9]|9\d)\d{7}$/;

export function isVnMobile(input: string) {
  return VN_MOBILE.test(normalizeVnPhone(input));
}
