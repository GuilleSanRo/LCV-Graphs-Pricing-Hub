import * as XLSX from "xlsx";
import { REQUIRED_COLUMNS, type Row, type ParsedDataset, type FinanceType, type FuelType } from "./types";

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.,\-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export interface ParseResult {
  ok: boolean;
  dataset?: ParsedDataset;
  error?: string;
  missingColumns?: string[];
}

export async function parseExcel(file: File): Promise<ParseResult> {
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return { ok: false, error: "Workbook contains no sheets." };
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    if (json.length === 0) return { ok: false, error: "Sheet is empty." };

    const headers = new Set(Object.keys(json[0]));
    const missing = REQUIRED_COLUMNS.filter((c) => !headers.has(c));
    if (missing.length) return { ok: false, error: "Missing required columns", missingColumns: missing };

    const seenVisit = new Map<string, number>();
    for (const r of json) {
      const vc = toStr(r["VisitCode"]);
      if (vc) seenVisit.set(vc, (seenVisit.get(vc) ?? 0) + 1);
    }

    const rows: Row[] = json.map((r) => {
      const issues: string[] = [];
      const market = toStr(r["Market"]);
      const make = toStr(r["Make"]);
      const model = toStr(r["Model"]);
      const modelMarket = toStr(r["Model Market"]) || model;
      const segment = toStr(r["Segment"]) || "Unspecified";
      const yearN = toNum(r["Year"]);
      const monthN = toNum(r["Month"]);
      const year = yearN !== null ? Math.trunc(yearN) : null;
      const month = monthN !== null ? Math.trunc(monthN) : null;
      const wave = year && month && month >= 1 && month <= 12 ? `${year}_${String(month).padStart(2, "0")}` : null;
      if (!wave) issues.push("Invalid Year/Month");

      if (!market || !make || !model || !year || !month) issues.push("Missing Make/Model/Market/Year/Month");

      const tp = toNum(r["Transaction Price"]);
      if (tp === null) issues.push("Missing Transaction Price");

      const bfDep = toNum(r["BF (Deposit)"]);
      const bfMon = toNum(r["BF (months)"]);
      const bfMp = toNum(r["BF (MP3 excl. costs/paid services)"]);
      const lsDep = toNum(r["LS (Deposit)"]);
      const lsMon = toNum(r["LS (months)"]);
      const lsMp = toNum(r["LS (MP3 excl. costs/services)"]);
      const hasBf = [bfDep, bfMon, bfMp].some((x) => x !== null);
      const hasLs = [lsDep, lsMon, lsMp].some((x) => x !== null);

      let financeType: FinanceType = "Unknown";
      let monthlyPayment: number | null = null;
      let deposit: number | null = null;
      let contractMonths: number | null = null;
      if (hasBf && hasLs) issues.push("Both BF and LS columns have data");
      else if (!hasBf && !hasLs) issues.push("No finance fields (BF nor LS) have data");
      else if (hasBf) {
        financeType = "Balloon Finance";
        monthlyPayment = bfMp;
        deposit = bfDep;
        contractMonths = bfMon;
      } else {
        financeType = "Leasing";
        monthlyPayment = lsMp;
        deposit = lsDep;
        contractMonths = lsMon;
      }

      const fuelType: FuelType = model.toUpperCase().endsWith("_EV") ? "BEV" : "ICE";

      const vc = toStr(r["VisitCode"]);
      if (vc && (seenVisit.get(vc) ?? 0) > 1) issues.push("Duplicate VisitCode");

      return {
        market,
        year,
        month,
        wave,
        segment,
        make,
        model,
        modelMarket,
        fuelType,
        financeType,
        transactionPrice: tp,
        monthlyPayment,
        deposit,
        contractMonths,
        discount: toNum(r["DSC (%%)"]),
        equipment: toNum(r["Equipment (€)"]),
        visitCode: vc,
        currencyId: r["CurrencyID"] != null ? toStr(r["CurrencyID"]) : undefined,
        issues,
        raw: r,
      };
    });

    return { ok: true, dataset: { rows, rowCount: rows.length, fileName: file.name } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to parse file" };
  }
}