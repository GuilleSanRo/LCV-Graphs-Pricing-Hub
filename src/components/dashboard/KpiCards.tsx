import type { Row } from "@/lib/dashboard/types";
import { mean, uniq, fmtEur, fmtPct, gapColor } from "@/lib/dashboard/utils";
import { useDashboard, refKey } from "@/lib/dashboard/store";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: React.ReactNode; tone?: "pos" | "neg" | "neutral" }) {
  const toneCls = tone === "pos" ? "text-[color:var(--success)]" : tone === "neg" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      {sub && <div className={`mt-2 flex items-center gap-1 text-xs ${toneCls}`}>{sub}</div>}
    </div>
  );
}

export function KpiCards({ rows }: { rows: Row[] }) {
  const reference = useDashboard((s) => s.reference);
  const refMode = useDashboard((s) => s.refMode);

  const modelsCount = uniq(rows.map((r) => `${r.make}|${r.modelMarket}`)).length;
  const avgTp = mean(rows.map((r) => r.transactionPrice));
  const avgMp = mean(rows.map((r) => r.monthlyPayment));
  const avgDsc = mean(rows.map((r) => r.discount));
  const avgEq = mean(rows.map((r) => r.equipment));

  let avgGap: number | null = null;
  if (reference) {
    const refRows = rows.filter((r) => r.make === reference.make && refKey(r, refMode) === reference.key);
    const refTp = mean(refRows.map((r) => r.transactionPrice));
    const nonRef = rows.filter((r) => !(r.make === reference.make && refKey(r, refMode) === reference.key));
    if (refTp) {
      const gaps = nonRef.map((r) => (r.transactionPrice !== null ? ((r.transactionPrice - refTp) / refTp) * 100 : null));
      avgGap = mean(gaps);
    }
  } else {
    // baseline = segment+market avg
    const gaps: (number | null)[] = rows.map((r) => {
      const peers = rows.filter((p) => p.segment === r.segment && p.market === r.market);
      const base = mean(peers.map((p) => p.transactionPrice));
      if (!base || r.transactionPrice === null) return null;
      return ((r.transactionPrice - base) / base) * 100;
    });
    avgGap = mean(gaps);
  }

  const Indicator = ({ n, cost }: { n: number | null; cost: boolean }) => {
    const tone = gapColor(n, cost);
    const Icon = tone === "pos" ? ArrowDown : tone === "neg" ? ArrowUp : Minus;
    return <><Icon className="h-3.5 w-3.5" /> {fmtPct(n)}</>;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Models analysed" value={modelsCount.toLocaleString()} sub={<span className="text-muted-foreground">{rows.length.toLocaleString()} rows</span>} tone="neutral" />
      <Kpi label="Avg Transaction Price" value={fmtEur(avgTp)} />
      <Kpi label="Avg Monthly Payment" value={fmtEur(avgMp)} />
      <Kpi label="Avg Discount" value={avgDsc === null ? "—" : `${avgDsc.toFixed(1)}%`} />
      <Kpi label="Avg Equipment" value={fmtEur(avgEq)} />
      <Kpi label="Avg Competitor Gap" value={fmtPct(avgGap)} sub={<Indicator n={avgGap} cost />} tone={gapColor(avgGap, true)} />
    </div>
  );
}