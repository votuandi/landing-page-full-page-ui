"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { mediaSrc, type MediaRef } from "@solar/sections";
import { describe } from "../schema/describe.ts";
import { issuesUnder, pathKey } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { describedBy, Errors, FieldShell, inputClass, SmallButton } from "../ui.tsx";
import { Field, fieldId } from "../fields/Field.tsx";

export function MediaField({ node, path, value, label }: FieldProps<MediaRef | undefined>) {
  const { idPrefix, issues, update, pickers } = useSchemaForm();
  const [failed, setFailed] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  // Picker trả kết quả bất đồng bộ: ghi vào đường dẫn hiện tại của ô (dòng có thể đã bị sắp xếp/xóa trong lúc chờ).
  const pathRef = useRef(path);
  const mounted = useRef(true);
  useLayoutEffect(() => { pathRef.current = path; }, [path]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  if (node.kind !== "widget") return null;
  const id = fieldId(idPrefix, [...path, "id"]);
  const current = value ?? { id: "", alt: { vi: "" } };
  const src = mediaSrc(value);
  const idErrors = issues.get(pathKey([...path, "id"]));
  const alt = describe((node.schema as unknown as { shape: { alt: never } }).shape.alt);
  const pick = async () => {
    setPickError(null);
    try {
      const picked = await pickers.media?.(value);
      if (picked && mounted.current) update(pathRef.current, picked);
    } catch {
      if (mounted.current) setPickError("Không mở được thư viện media, vui lòng thử lại");
    }
  };
  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-media bg-bg-tint text-xs text-fg-subtle sm:w-40">
          {src && failed !== src
            // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước trong CMS, không cần tối ưu
            ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(src)} />
            : current.id ? "Không xem trước được" : "Chưa có ảnh"}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {pickers.media
            ? <SmallButton className="border border-line/25" onClick={pick}>{current.id ? "Đổi ảnh…" : "Chọn từ thư viện…"}</SmallButton>
            : (
              <FieldShell id={id} label="Mã ảnh hoặc đường dẫn" errors={idErrors}
                hint="Thư viện media sẽ có ở bản sau; tạm nhập mã ảnh, đường dẫn /… hoặc https://…">
                <input id={id} type="text" value={current.id} className={inputClass}
                  aria-invalid={idErrors?.length ? true : undefined} aria-describedby={describedBy(id, "hint", idErrors)}
                  onChange={(event) => update(path, { ...current, id: event.target.value })} />
              </FieldShell>
            )}
          {pickers.media && <Errors errors={[...(idErrors ?? []), ...(pickError ? [pickError] : [])]} />}
          <Field node={alt} path={[...path, "alt"]} value={current.alt} label="Mô tả ảnh (alt)" />
          <Errors errors={issuesUnder(issues, [...path, "focal"])} />
        </div>
      </div>
    </fieldset>
  );
}
