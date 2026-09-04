import type { Row } from "./types";

export const mean = (arr: (number | null | undefined)[]): number | null => {
  const v = arr.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
};

export const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

export const fmtEur = (n: number | null | undefined, digits = 0, currency = "EUR") =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-EU", { style: "currency", currency, maximumFractionDigits: digits }).format(n);

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

/** 
 * Sorts model cards by brand (make). 
 * Stellantis brands (Citroen, Fiat, Opel, Peugeot, Vauxhall) appear first in alphabetical order.
 * All other brands follow in alphabetical order. 
 * Within the same brand, models are sorted by modelMarket.
 */
export function sortCardsByBrand<T extends { make: string; modelMarket: string }>(cards: T[]): T[] {
  const stellantisBrands = ["CITROEN", "FIAT", "OPEL", "PEUGEOT", "VAUXHALL", "OPEL/VAUXHALL"];
  
  return cards.sort((a, b) => {
    const makeA = a.make.toUpperCase();
    const makeB = b.make.toUpperCase();

    const isStellantisA = stellantisBrands.includes(makeA);
    const isStellantisB = stellantisBrands.includes(makeB);

    // Stellantis brands come before non-Stellantis
    if (isStellantisA && !isStellantisB) return -1;
    if (!isStellantisA && isStellantisB) return 1;

    // Both are Stellantis or both are not. Sort alphabetically by make.
    const makeDiff = makeA.localeCompare(makeB);
    if (makeDiff !== 0) return makeDiff;

    // If same make, sort by modelMarket
    return a.modelMarket.localeCompare(b.modelMarket);
  });
}