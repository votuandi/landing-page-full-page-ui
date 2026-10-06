"use client";
import Link from "next/link";
import { useState } from "react";
import {
  CALCULATOR,
  COPY,
  SEGMENTS,
  SEGMENT_IDS,
  type Region,
  type Segment,
} from "@/content/site";
import { estimateSolar, moneyVi, numberVi } from "@/utils/estimate";
import { contactUrl, useSegment } from "./SegmentContext";
import { SectionTitle } from "./Sections";
export default function Calculator({ fixed }: { fixed?: Segment }) {
  const { segment, select } = useSegment();
  const current = segment ?? fixed ?? "factory";
  const [mode, setMode] = useState<"bill" | "roof">("bill");
  const [region, setRegion] = useState<Region>("south");
  const [values, setValues] = useState<Record<string, string>>({});
  const key = `${current}-${mode}`;
  const value =
    values[key] ??
    String(
      mode === "bill"
        ? CALCULATOR.segments[current].defaultBill
        : CALCULATOR.segments[current].defaultRoof,
    );
  const t = COPY.calculator;
  const input = { segment: current, region, mode, value: Number(value) };
  const result = estimateSolar(input),
    s = CALCULATOR.segments[current],
    r = CALCULATOR.regions[region],
    limit = CALCULATOR.limits[mode];
  const q = new URLSearchParams({ mode, value, region });
  return (
    <section id="may-tinh" className="t5-section bg-blue-50">
      <div className="t5-container">
        <SectionTitle
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
        />
        <div
          role="group"
          aria-label={t.tabs}
          className="mb-6 flex flex-wrap gap-2"
        >
          {SEGMENT_IDS.map((id) => (
            <button
              key={id}
              aria-pressed={id === current}
              onClick={() => select(id)}
              className={`segment-pill ${id === current ? "is-selected" : ""} disabled:opacity-40`}
            >
              {SEGMENTS[id].label}
            </button>
          ))}
        </div>
        <div className="t8-card grid overflow-hidden lg:grid-cols-2">
          <div className="p-6 sm:p-9">
            <fieldset>
              <legend className="t5-label">{t.inputMode}</legend>
              <div className="mt-3 flex gap-2">
                {(["bill", "roof"] as const).map((m) => (
                  <button
                    key={m}
                    aria-pressed={m === mode}
                    onClick={() => setMode(m)}
                    className={`segment-pill ${mode === m ? "is-selected" : ""}`}
                  >
                    {m === "bill" ? t.billMode : t.roofMode}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="t5-label mt-6" htmlFor="estimate-value">
              {mode === "bill" ? t.bill : t.roof}
              <input
                id="estimate-value"
                type="number"
                inputMode="decimal"
                min={limit.min}
                max={limit.max}
                step="any"
                value={value}
                onChange={(e) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: e.target.value,
                  }))
                }
                className="t5-input"
                aria-describedby="estimate-range"
                aria-invalid={!result}
              />
            </label>
            <p id="estimate-range" className="mt-2 text-xs text-slate-600">
              {numberVi(limit.min)} – {numberVi(limit.max)}
            </p>
            <label className="t5-label mt-6" htmlFor="estimate-region">
              {t.region}
              <select
                id="estimate-region"
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="t5-input"
              >
                {(Object.keys(CALCULATOR.regions) as Region[]).map((key) => (
                  <option key={key} value={key}>
                    {CALCULATOR.regions[key].label}
                  </option>
                ))}
              </select>
            </label>
            <details className="mt-6 text-sm">
              <summary className="cursor-pointer font-bold text-blue-900">
                {t.assumptions}
              </summary>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
                {[
                  [t.rate, moneyVi(s.electricityRate) + "/kWh"],
                  [t.sun, numberVi(r.sunHours, 1)],
                  [t.selfUse, numberVi(s.selfUse * 100) + "%"],
                  [t.roofFactor, numberVi(CALCULATOR.roofM2PerKwp) + " m²"],
                  [t.cost, moneyVi(s.costPerKwp)],
                  [
                    t.maintenance,
                    numberVi(CALCULATOR.annualMaintenanceRate * 100) + "%",
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="mt-1 font-bold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
          <div
            className="bg-blue-900 p-6 text-white sm:p-9"
            aria-live="polite"
            aria-atomic="true"
          >
            {result ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  {t.kwp}
                </p>
                <p className="mt-3 text-5xl font-black tracking-tight">
                  {numberVi(result.kwp, 2)}
                  <span className="ml-2 text-xl">kWp</span>
                </p>
                <dl className="mt-7 grid grid-cols-2 gap-6">
                  {[
                    [t.monthly, moneyVi(result.monthlySaving)],
                    [t.annual, moneyVi(result.annualSaving)],
                    [
                      t.payback,
                      result.paybackYears
                        ? numberVi(result.paybackYears, 1) + " " + COPY.years
                        : t.noPayback,
                    ],
                    [t.co2, numberVi(result.co2Kg) + " " + t.kg],
                    [t.investment, moneyVi(result.investment)],
                    [t.roof, numberVi(result.roofArea, 1) + " m²"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-blue-100">{k}</dt>
                      <dd className="mt-2 text-base font-black sm:text-lg">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link
                  href={contactUrl(current, q)}
                  className="t5-button mt-8 w-full bg-amber-300 text-blue-950"
                >
                  {t.quote} <span aria-hidden="true">↗</span>
                </Link>
              </>
            ) : (
              <p role="alert" className="font-bold">
                {t.invalid}
              </p>
            )}
            <p className="mt-5 text-xs leading-6 text-blue-100">
              {COPY.reference}. {COPY.conditions}
            </p>
            {mode === "roof" && (
              <p className="mt-2 text-xs leading-6 text-blue-100">
                {t.roofWarning}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
