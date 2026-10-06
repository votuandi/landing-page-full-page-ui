"use client";
import { useEffect, useState } from "react";
import { COPY, SEGMENTS, SEGMENT_IDS, type Segment } from "@/content/site";
import { useSegment } from "./template10/SegmentContext";
export default function LeadForm({
  defaultMessage = "",
  defaultSegment = null,
}: {
  defaultMessage?: string;
  defaultSegment?: Segment | null;
}) {
  const { segment, select } = useSegment();
  const [customer, setCustomer] = useState<Segment | "">(defaultSegment ?? ""),
    [message, setMessage] = useState(defaultMessage);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "demo" | "error"
  >("idle");
  const t = COPY.contact;
  useEffect(
    () => setCustomer(segment ?? defaultSegment ?? ""),
    [defaultSegment, segment],
  );
  useEffect(() => setMessage(defaultMessage), [defaultMessage]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, segment: customer, consent: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setStatus(data.mode === "demo" ? "demo" : "success");
    } catch {
      setStatus("error");
    }
  }
  return (
    <form onSubmit={submit} className="t8-card p-6 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="t5-label">
          {t.name}
          <input
            className="t5-input"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            placeholder={t.namePlaceholder}
          />
        </label>
        <label className="t5-label">
          {t.phone}
          <input
            className="t5-input"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            pattern="[+0-9\(\) .\-]{9,20}"
            maxLength={20}
            placeholder={t.phonePlaceholder}
          />
        </label>
        <label className="t5-label">
          {t.email}
          <input
            className="t5-input"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            placeholder={t.emailPlaceholder}
          />
        </label>
        <label className="t5-label">
          {t.company}
          <input
            className="t5-input"
            name="company"
            autoComplete="organization"
            maxLength={200}
            placeholder={t.companyPlaceholder}
          />
        </label>
      </div>
      <label className="t5-label mt-5">
        {t.segment}
        <select
          className="t5-input"
          name="segment"
          value={customer}
          onChange={(e) => {
            const s = e.target.value as Segment | "";
            setCustomer(s);
            select(s || null);
          }}
        >
          <option value="">{t.general}</option>
          {SEGMENT_IDS.map((s) => (
            <option key={s} value={s}>
              {SEGMENTS[s].fullLabel}
            </option>
          ))}
        </select>
      </label>
      <label className="t5-label mt-5">
        {t.message}
        <textarea
          className="t5-input min-h-36"
          name="message"
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
        />
      </label>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-5 w-5 shrink-0 accent-blue-900"
        />
        {t.consent}
      </label>
      <button
        className="t5-button t5-button-primary mt-6 w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? t.sending : t.submit}
      </button>
      <p className="mt-4 text-xs leading-6 text-slate-600">{t.demoNotice}</p>
      <div role="status" aria-live="polite">
        {status === "error" && (
          <p className="mt-5 font-bold text-red-800">{t.error}</p>
        )}
        {(status === "demo" || status === "success") && (
          <div className="mt-5 rounded-2xl bg-blue-50 p-5">
            <p className="font-bold text-blue-900">
              {status === "demo" ? t.demoSuccess : t.success}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {status === "demo" ? t.demoSuccessText : t.successText}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
