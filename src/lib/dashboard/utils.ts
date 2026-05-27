import type { Row } from "./types";

export const mean = (arr: (number | null | undefined)[]): number | null => {
  const v = arr.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
};

export const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

export const fmtEur = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n);

export const fmtNum = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-EU", { maximumFractionDigits: digits }).format(n);

export const fmtPct = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export function percentile(arr: number[], p: number): number | null {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx); const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function gapPct(value: number | null, ref: number | null): number | null {
  if (value === null || ref === null || !ref) return null;
  return ((value - ref) / ref) * 100;
}

export function groupBy<T, K extends string | number>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const a = m.get(k);
    if (a) a.push(r); else m.set(k, [r]);
  }
  return m;
}

export type MetricKey = "transactionPrice" | "monthlyPayment" | "discount" | "equipment";

export function pick(r: Row, m: MetricKey): number | null {
  return r[m];
}

/** Returns color semantic for gap. cost=true means lower is better. */
export function gapColor(gap: number | null, cost: boolean): "pos" | "neg" | "neutral" {
  if (gap === null || Math.abs(gap) < 0.05) return "neutral";
  if (cost) return gap < 0 ? "pos" : "neg";
  return gap > 0 ? "pos" : "neg";
}