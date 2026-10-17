"use client";

import { useState } from "react";

const marker = "SECTIONS_ISLAND_demo-a_v2";

export default function CounterIsland() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" data-island={marker} onClick={() => setCount((value) => value + 1)}
      className="min-h-11 rounded-pill bg-primary px-5 py-3 font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <span aria-live="polite">Số lần nhấn: {count}</span>
    </button>
  );
}
