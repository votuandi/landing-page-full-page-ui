import { mount, setConfirm } from "./dom.ts";
import { afterEach } from "node:test";
import { useState } from "react";
import type { z } from "zod";
import { SchemaForm, type SchemaFormProps } from "../SchemaForm.tsx";

type Log = { submitted: unknown[]; changes: unknown[] };

function Controlled<S extends z.ZodType>({ initial, log, ...props }: Omit<SchemaFormProps<S>, "value" | "onChange" | "onSubmit"> & { initial: unknown; log: Log }) {
  const [value, setValue] = useState(initial);
  return <SchemaForm {...props} value={value as z.input<S>}
    onChange={(next) => { log.changes.push(next); setValue(next); }}
    onSubmit={(data) => log.submitted.push(data)} />;
}

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).forEach((fn) => fn()); setConfirm(true); });

/** Form có state như trang thật; `log` ghi mọi onChange/onSubmit. */
export async function render<S extends z.ZodType>(schema: S, initial: unknown, extra: Partial<SchemaFormProps<S>> = {}) {
  const log: Log = { submitted: [], changes: [] };
  const mounted = await mount(<Controlled schema={schema} initial={structuredClone(initial)} log={log} {...extra} />);
  cleanup.push(mounted.unmount);
  return { ...mounted, log, last: () => log.changes.at(-1) };
}
