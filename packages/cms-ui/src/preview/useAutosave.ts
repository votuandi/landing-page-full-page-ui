"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
type SaveResult = { ok: true } | { ok: false; error: string; conflict?: boolean };
type Options<T> = { save(value: T): Promise<SaveResult>; valid(value: T): boolean; delay?: number };
type Failure = { key: string; error: string; conflict?: boolean };
export type AutosaveStatus = "saved" | "pending" | "saving" | "invalid" | "error" | "conflict";

/** One request at a time; after completion only the latest committed value is eligible. */
export function useAutosave<T>(value: T, opts: Options<T>): { status: AutosaveStatus; error?: string; dirty: boolean; flush(): Promise<void> } {
  const key = JSON.stringify(value);
  const valid = opts.valid(value);
  const saved = useRef(key);
  const latest = useRef({ value, key, opts });
  const running = useRef<Promise<void> | null>(null);
  const failure = useRef<Failure | null>(null);
  const mounted = useRef(false);
  const [snapshot, setSnapshot] = useState<{ savedKey: string; saving: boolean; failure: Failure | null }>({ savedKey: key, saving: false, failure: null });
  const notify = useCallback(() => {
    if (mounted.current) setSnapshot({ savedKey: saved.current, saving: Boolean(running.current), failure: failure.current });
  }, []);
  useLayoutEffect(() => { latest.current = { value, key, opts }; });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const save = useCallback(async () => {
    if (running.current) return running.current;
    const snapshot = latest.current;
    if (failure.current?.conflict || snapshot.key === saved.current || !snapshot.opts.valid(snapshot.value)) return;
    failure.current = null;
    running.current = Promise.resolve().then(async () => {
      try {
        const result = await snapshot.opts.save(snapshot.value);
        if (result.ok) saved.current = snapshot.key;
        else failure.current = { key: snapshot.key, ...result };
      } catch { failure.current = { key: snapshot.key, error: "Không thể kết nối. Vui lòng thử lại." }; }
      finally { running.current = null; notify(); }
    });
    notify();
    return running.current;
  }, [notify]);
  useEffect(() => {
    if (running.current || failure.current?.conflict || key === saved.current || !latest.current.opts.valid(latest.current.value) || failure.current?.key === key) return;
    const timer = setTimeout(() => { void save(); }, opts.delay ?? 800);
    return () => clearTimeout(timer);
  }, [key, valid, snapshot, opts.delay, save]);
  const flush = useCallback(async () => {
    if (running.current) await running.current;
    if (mounted.current) await save();
  }, [save]);
  const status: AutosaveStatus = snapshot.failure?.conflict ? "conflict" : snapshot.saving ? "saving"
    : !valid ? "invalid" : key === snapshot.savedKey ? "saved" : snapshot.failure?.key === key ? "error" : "pending";
  return { status, error: status === "error" || status === "conflict" ? snapshot.failure?.error : undefined, dirty: status !== "saved", flush };
}
