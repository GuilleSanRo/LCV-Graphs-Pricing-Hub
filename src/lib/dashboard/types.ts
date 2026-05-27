export const REQUIRED_COLUMNS = [
  "BF (Deposit)",
  "BF (months)",
  "BF (MP3 excl. costs/paid services)",
  "DSC (%%)",
  "Equipment (€)",
  "LS (Deposit)",
  "LS (months)",
  "LS (MP3 excl. costs/services)",
  "Make",
  "Market",
  "Model",
  "Model Market",
  "Month",
  "Segment",
  "Transaction Price",
  "VisitCode",
  "Year",
] as const;

export type FinanceType = "Balloon Finance" | "Leasing" | "Unknown";
export type FuelType = "BEV" | "ICE";

export interface Row {
  market: string;
  year: number | null;
  month: number | null;
  wave: string | null;
  segment: string;
  make: string;
  model: string;
  modelMarket: string;
  fuelType: FuelType;
  financeType: FinanceType;
  transactionPrice: number | null;
  monthlyPayment: number | null;
  deposit: number | null;
  contractMonths: number | null;
  discount: number | null;
  equipment: number | null;
  visitCode: string;
  currencyId?: string;
  issues: string[];
  raw: Record<string, unknown>;
}

export interface ParsedDataset {
  rows: Row[];
  rowCount: number;
  fileName: string;
}