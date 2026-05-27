import { create } from "zustand";
import type { ParsedDataset, Row } from "./types";

export type RefMode = "modelMarket" | "model";

export interface Filters {
  markets: string[];
  years: number[];
  months: number[];
  waves: string[];
  fuels: string[];
  segments: string[];
}

export interface Reference {
  make: string;
  key: string; // modelMarket or model value
}

interface State {
  dataset: ParsedDataset | null;
  filters: Filters;
  refMode: RefMode;
  reference: Reference | null;
  setDataset: (d: ParsedDataset | null) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  setRefMode: (m: RefMode) => void;
  setReference: (r: Reference | null) => void;
}

export const emptyFilters: Filters = {
  markets: [], years: [], months: [], waves: [], fuels: [], segments: [],
};

export const useDashboard = create<State>((set) => ({
  dataset: null,
  filters: emptyFilters,
  refMode: "modelMarket",
  reference: null,
  setDataset: (d) => set({ dataset: d, filters: emptyFilters, reference: null }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: emptyFilters }),
  setRefMode: (m) => set({ refMode: m, reference: null }),
  setReference: (r) => set({ reference: r }),
}));

export function applyFilters(rows: Row[], f: Filters): Row[] {
  return rows.filter((r) => {
    if (f.markets.length && !f.markets.includes(r.market)) return false;
    if (f.years.length && (r.year === null || !f.years.includes(r.year))) return false;
    if (f.months.length && (r.month === null || !f.months.includes(r.month))) return false;
    if (f.waves.length && (!r.wave || !f.waves.includes(r.wave))) return false;
    if (f.fuels.length && !f.fuels.includes(r.fuelType)) return false;
    if (f.segments.length && !f.segments.includes(r.segment)) return false;
    return true;
  });
}

export function refKey(r: Row, mode: RefMode): string {
  return mode === "modelMarket" ? r.modelMarket : r.model;
}