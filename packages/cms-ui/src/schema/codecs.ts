export type Decoded<T> = { ok: true; value: T } | { ok: false; message: string };

export type Codec<T> = { toInput(value: T): string; fromInput(input: string): Decoded<T> };

/** Ô số: nhận dấu phẩy thập phân; chuỗi rỗng chỉ hợp lệ khi trường cho phép trống. Không bao giờ trả chuỗi. */
export function numberCodec(empty?: "null" | "undefined"): Codec<number | null | undefined> {
  return {
    toInput: (value) => (typeof value === "number" ? formatNumber(value) : ""),
    fromInput(input) {
      const text = input.trim().replace(/\s/g, "").replace(",", ".");
      if (text === "") {
        if (empty === "null") return { ok: true, value: null };
        if (empty === "undefined") return { ok: true, value: undefined };
        return { ok: false, message: "Vui lòng nhập một số" };
      }
      const value = Number(text);
      if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value)) {
        return { ok: false, message: "Chỉ nhập số (vd. 1500 hoặc 0,8)" };
      }
      return { ok: true, value };
    },
  };
}

/** Kiểu Việt Nam dễ đọc khi sửa: nhóm nghìn bằng dấu cách, thập phân bằng dấu phẩy (fromInput đọc lại được). */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e21 || /e/i.test(String(value))) return String(value);
  const [int, frac] = String(value).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac ? `${grouped},${frac}` : grouped;
}
