"use client";

import type { BuilderData } from "../../../../../lib/pageSections.ts";

/** Điểm thay thế của mỗi demo (spike E12-S01): base để trống làm mốc đo bundle. */
export default function BuilderDemo({ data }: { data: BuilderData }) {
  return <p>{data.editor.page.title}</p>;
}
