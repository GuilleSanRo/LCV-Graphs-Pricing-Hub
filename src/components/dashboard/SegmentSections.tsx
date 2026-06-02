import { useMemo, useState } from "react";
import type { Row } from "@/lib/dashboard/types";
import { mean, groupBy, percentile, fmtEur, fmtPct, gapPct, gapColor, uniq } from "@/lib/dashboard/utils";
import { useDashboard, refKey, type RefMode } from "@/lib/dashboard/store";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowDown, ArrowUp, Minus, Target } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LineChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";

interface CardModel {
  make: string;
  modelMarket: string;
  model: string;
  fuel: string;
  finance: string;
  rows: Row[];
  tp: number | null;
  minTp: number | null;
  maxTp: number | null;
  mp: number | null;
  dsc: number | null;
  minDsc: number | null;
  maxDsc: number | null;
  eq: number | null;
}

function MinAvgMaxBarChart({ min, avg, max, isPercent }: { min: number | null; avg: number | null; max: number | null; isPercent?: boolean }) {
  if (min === null || avg === null || max === null) {
    return <div className="h-24 rounded bg-muted/20" />;
  }

  // Calculate dynamic baseline to visually emphasize differences while keeping it honest
  const range = max - min;
  const baseline = range === 0 ? 0 : min - range * 1.5;
  const getHeight = (val: number) => {
    if (range === 0) return 50; // if min==max, show half height
    return Math.max(15, ((val - Math.max(0, baseline)) / (max - Math.max(0, baseline))) * 100);
  };

  const fmt = (v: number) => isPercent ? `${Math.round(v)} %` : Math.round(v).toLocaleString();

  return (
    <div className="mt-2 flex h-32 items-end gap-[2px] px-2 pt-6 pb-2">
      {/* Min Bar */}
      <div className="flex h-full flex-1 flex-col items-center justify-end">
        <span className="mb-1 text-[10px] text-muted-foreground/80">{fmt(min)}</span>
        <div className="w-full border border-destructive bg-background" style={{ height: `${getHeight(min)}%` }} />
      </div>
      {/* Avg Bar (Transaction Price) */}
      <div className="flex h-full flex-1 flex-col items-center justify-end">
        <span className="mb-1 text-[11px] font-bold text-foreground">{fmt(avg)}</span>
        <div className="w-full bg-[#4a90e2]" style={{ height: `${getHeight(avg)}%` }} />
      </div>
      {/* Max Bar */}
      <div className="flex h-full flex-1 flex-col items-center justify-end">
        <span className="mb-1 text-[10px] text-muted-foreground/80">{fmt(max)}</span>
        <div className="w-full border border-[color:var(--success)] bg-background" style={{ height: `${getHeight(max)}%` }} />
      </div>
    </div>
  );
}

function GapBadge({ gap, base, cost = true }: { gap: number | null; base?: boolean; cost?: boolean }) {
  if (base) return <Badge variant="secondary" className="rounded-md">Base</Badge>;
  const tone = gapColor(gap, cost);
  const cls = tone === "pos"
    ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
    : tone === "neg" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
  const Icon = tone === "pos" ? ArrowDown : tone === "neg" ? ArrowUp : Minus;
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}><Icon className="h-3 w-3" />{fmtPct(gap)}</span>;
}

export function SegmentSections({ rows }: { rows: Row[] }) {
  const reference = useDashboard((s) => s.reference);
  const setReference = useDashboard((s) => s.setReference);
  const refMode = useDashboard((s) => s.refMode);
  const setRefMode = useDashboard((s) => s.setRefMode);
  const [openCard, setOpenCard] = useState<CardModel | null>(null);

  const sections = useMemo(() => {
    const bySegment = groupBy(rows, (r) => r.segment);
    return Array.from(bySegment.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([segment, segRows]) => {
        const byCard = groupBy(segRows, (r) => `${r.make}__${r.modelMarket}`);
        const cards: CardModel[] = Array.from(byCard.entries()).map(([, rs]) => {
          const tpVals = rs.map((r) => r.transactionPrice).filter((x): x is number => x !== null);
          const dscVals = rs.map((r) => r.discount).filter((x): x is number => x !== null);
          return {
            make: rs[0].make,
            modelMarket: rs[0].modelMarket,
            model: rs[0].model,
            fuel: rs[0].fuelType,
            finance: rs[0].financeType,
            rows: rs,
            tp: mean(tpVals),
            minTp: tpVals.length ? Math.min(...tpVals) : null,
            maxTp: tpVals.length ? Math.max(...tpVals) : null,
            mp: mean(rs.map((r) => r.monthlyPayment)),
            dsc: mean(dscVals),
            minDsc: dscVals.length ? Math.min(...dscVals) : null,
            maxDsc: dscVals.length ? Math.max(...dscVals) : null,
            eq: mean(rs.map((r) => r.equipment)),
          };
        });
        cards.sort((a, b) => a.modelMarket.localeCompare(b.modelMarket));
        const tpVals = segRows.map((r) => r.transactionPrice).filter((x): x is number => x !== null);
        const p25 = tpVals.length >= 4 ? percentile(tpVals, 0.25) : (tpVals.length ? Math.min(...tpVals) : null);
        const p75 = tpVals.length >= 4 ? percentile(tpVals, 0.75) : (tpVals.length ? Math.max(...tpVals) : null);
        return { segment, cards, p25, p75 };
      });
  }, [rows]);

  // Reference TP value (from filtered rows)
  const refTp = useMemo(() => {
    if (!reference) return null;
    const refRows = rows.filter((r) => r.make === reference.make && refKey(r, refMode) === reference.key);
    return mean(refRows.map((r) => r.transactionPrice));
  }, [rows, reference, refMode]);

  // Reference DSC value
  const refDsc = useMemo(() => {
    if (!reference) return null;
    const refRows = rows.filter((r) => r.make === reference.make && refKey(r, refMode) === reference.key);
    return mean(refRows.map((r) => r.discount));
  }, [rows, reference, refMode]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <div>
          <div className="text-sm font-semibold text-foreground">Reference selection</div>
          <div className="text-xs text-muted-foreground">Click any card below to make it the reference (Base) and view % gaps for competitors.</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Match by</span>
          <div className="flex items-center gap-2 text-xs">
            <span className={refMode === "modelMarket" ? "font-semibold text-foreground" : "text-muted-foreground"}>Model Market</span>
            <Switch checked={refMode === "model"} onCheckedChange={(c) => setRefMode((c ? "model" : "modelMarket") as RefMode)} />
            <span className={refMode === "model" ? "font-semibold text-foreground" : "text-muted-foreground"}>Model</span>
          </div>
        </div>
      </div>

      {sections.map(({ segment, cards, p25, p75 }) => (
        <div key={segment}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{segment}</h3>
            <span className="text-xs text-muted-foreground">{uniq(cards.map((c) => c.modelMarket)).length} models</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mb-4 mt-2 text-center">
            <h4 className="text-lg font-bold text-foreground">Transaction Price</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => {
              const isBase = !!reference && reference.make === c.make && reference.key === (refMode === "modelMarket" ? c.modelMarket : c.model);
              const gap = isBase ? null : gapPct(c.tp, refTp);
              return (
                <button
                  key={`${c.make}-${c.modelMarket}`}
                  onClick={() => {
                    const key = refMode === "modelMarket" ? c.modelMarket : c.model;
                    if (isBase) setReference(null);
                    else setReference({ make: c.make, key });
                  }}
                  onDoubleClick={() => setOpenCard(c)}
                  className={`group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-[0_2px_8px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(16,24,40,0.08)] ${
                    isBase ? "border-[#60a5fa] ring-1 ring-[#60a5fa]" : "border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-foreground">{c.modelMarket}</div>
                        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.make}</div>
                      </div>
                      {isBase && <Badge className="rounded-md bg-[#e0f2fe] text-[#0284c7] hover:bg-[#e0f2fe] border-none shadow-none uppercase text-[9px] font-bold tracking-wider px-1.5 py-0">DOMESTIC</Badge>}
                    </div>

                    <MinAvgMaxBarChart min={c.minTp} avg={c.tp} max={c.maxTp} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">vs {reference ? reference.make : "Segment"}</span>
                    <GapBadge gap={gap} base={isBase} cost />
                  </div>

                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); setOpenCard(c); }}
                    className="absolute right-3 top-3 cursor-pointer text-[10px] text-muted-foreground opacity-0 transition hover:text-primary group-hover:opacity-100"
                  >Details →</span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 mt-8 text-center">
            <h4 className="text-lg font-bold text-foreground">Discount</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => {
              const isBase = !!reference && reference.make === c.make && reference.key === (refMode === "modelMarket" ? c.modelMarket : c.model);
              const gap = isBase ? null : gapPct(c.dsc, refDsc);
              return (
                <button
                  key={`${c.make}-${c.modelMarket}-dsc`}
                  onClick={() => {
                    const key = refMode === "modelMarket" ? c.modelMarket : c.model;
                    if (isBase) setReference(null);
                    else setReference({ make: c.make, key });
                  }}
                  onDoubleClick={() => setOpenCard(c)}
                  className={`group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-[0_2px_8px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(16,24,40,0.08)] ${
                    isBase ? "border-[#60a5fa] ring-1 ring-[#60a5fa]" : "border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-foreground">{c.modelMarket}</div>
                        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.make}</div>
                      </div>
                      {isBase && <Badge className="rounded-md bg-[#e0f2fe] text-[#0284c7] hover:bg-[#e0f2fe] border-none shadow-none uppercase text-[9px] font-bold tracking-wider px-1.5 py-0">DOMESTIC</Badge>}
                    </div>

                    <MinAvgMaxBarChart min={c.minDsc} avg={c.dsc} max={c.maxDsc} isPercent />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">vs {reference ? reference.make : "Segment"}</span>
                    <GapBadge gap={gap} base={isBase} cost={false} />
                  </div>

                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); setOpenCard(c); }}
                    className="absolute right-3 top-3 cursor-pointer text-[10px] text-muted-foreground opacity-0 transition hover:text-primary group-hover:opacity-100"
                  >Details →</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Sheet open={!!openCard} onOpenChange={(o) => !o && setOpenCard(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {openCard && (
            <>
              <SheetHeader>
                <SheetTitle>{openCard.modelMarket}</SheetTitle>
                <SheetDescription>{openCard.make} · {openCard.fuel} · {openCard.finance}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat label="Avg Transaction Price" v={fmtEur(openCard.tp)} />
                <Stat label="Avg Monthly Payment" v={fmtEur(openCard.mp)} />
                <Stat label="Avg Discount" v={openCard.dsc === null ? "—" : `${openCard.dsc.toFixed(1)}%`} />
                <Stat label="Avg Equipment" v={fmtEur(openCard.eq)} />
              </div>
              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price by Wave</div>
                <TrendByWave rows={openCard.rows} />
              </div>
              <div className="mt-4 text-xs text-muted-foreground">{openCard.rows.length} observations · click <Target className="inline h-3 w-3 text-primary" /> single-click card to set as reference</div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-foreground">{v}</div>
    </div>
  );
}

function TrendByWave({ rows }: { rows: Row[] }) {
  const data = Array.from(groupBy(rows.filter((r) => r.wave), (r) => r.wave as string).entries())
    .map(([wave, rs]) => ({ wave, tp: mean(rs.map((r) => r.transactionPrice)) ?? 0 }))
    .sort((a, b) => a.wave.localeCompare(b.wave));
  if (data.length < 2) return <div className="rounded-lg border border-border p-4 text-xs text-muted-foreground">Not enough waves to plot.</div>;
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <XAxis dataKey="wave" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={50} />
          <RTooltip formatter={(v: number) => fmtEur(v)} />
          <Line type="monotone" dataKey="tp" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}