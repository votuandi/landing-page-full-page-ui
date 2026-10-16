"use client";

export default function Crash() {
  if (typeof window !== "undefined") throw new Error("[DỮ LIỆU MẪU] lỗi render phía client");
  return <p className="text-fg-muted">Đoạn này chỉ có trong HTML server.</p>;
}
