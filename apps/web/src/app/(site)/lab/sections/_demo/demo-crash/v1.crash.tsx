"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function Crash() {
  // Match SSR during hydration; React reports hydration failures globally before local boundaries recover.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (hydrated) throw new Error("[DỮ LIỆU MẪU] lỗi render phía client");
  return <p className="text-fg-muted">Đoạn này chỉ có trong HTML server.</p>;
}
