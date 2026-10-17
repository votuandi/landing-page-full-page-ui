"use client";

import { createContext, useContext, type ComponentType } from "react";
import type { MediaRef } from "@solar/sections";
import type { FieldNode } from "./schema/describe.ts";
import type { Path } from "./schema/path.ts";

export type FieldProps<T = unknown> = { node: FieldNode; path: Path; value: T; label: string };
export type WidgetComponent = ComponentType<FieldProps<any>>;

export type Pickers = {
  /** Mở thư viện media (E8-S05); trả null khi người dùng hủy. Không có → ô nhập mã media. */
  media?: (current: MediaRef | undefined) => Promise<MediaRef | null>;
  /** Trang của site cho link loại "page". */
  pages?: readonly { slug: string; label: string }[];
  /** Mục của collection cho `collectionQuery.ids`. */
  collectionItems?: (collection: string) => Promise<readonly { id: string; label: string }[]>;
};

export type FormContext = {
  idPrefix: string;
  issues: Map<string, string[]>;
  bilingual: boolean;
  pickers: Pickers;
  /** Override theo đường dẫn (`tariffs.*.tiers`, số chỉ mục viết `*`) hoặc theo widget/kind (`media`, `number`). */
  widgets: Partial<Record<string, WidgetComponent>>;
  labels: Partial<Record<string, string>>;
  update(path: Path, next: unknown): void;
  /** Lỗi ô nhập chưa đổi được sang đúng kiểu; còn lỗi thì khóa nút lưu. */
  setInputError(key: string, message: string | null): void;
};

export const SchemaFormContext = createContext<FormContext | null>(null);

export function useSchemaForm(): FormContext {
  const ctx = useContext(SchemaFormContext);
  if (!ctx) throw new Error("[cms-ui] field nằm ngoài <SchemaForm>");
  return ctx;
}
