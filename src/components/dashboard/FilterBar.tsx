import { useMemo } from "react";
import { useDashboard, emptyFilters } from "@/lib/dashboard/store";
import { MultiSelect } from "./MultiSelect";
import { Button } from "@/components/ui/button";
import { RotateCcw, Target } from "lucide-react";
import { uniq } from "@/lib/dashboard/utils";

export function FilterBar() {
  const dataset = useDashboard((s) => s.dataset);
  const filters = useDashboard((s) => s.filters);
  const setFilters = useDashboard((s) => s.setFilters);
  const resetFilters = useDashboard((s) => s.resetFilters);
  const reference = useDashboard((s) => s.reference);
  const setReference = useDashboard((s) => s.setReference);

  const opts = useMemo(() => {
    const rows = dataset?.rows ?? [];
    return {
      markets: uniq(rows.map((r) => r.market)).filter(Boolean).sort(),

      waves: uniq(rows.map((r) => r.wave).filter((y): y is string => !!y)).sort(),
      fuels: uniq(rows.map((r) => r.fuelType)).sort(),
      segments: uniq(rows.map((r) => r.segment)).filter(Boolean).sort(),
    };
  }, [dataset]);

  if (!dataset) return null;

  const active = Object.values(filters).some((v) => v.length > 0) || !!reference;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelect label="Market" options={opts.markets} value={filters.markets} onChange={(v) => setFilters({ markets: v as string[] })} />

        <MultiSelect label="Wave" options={opts.waves} value={filters.waves} onChange={(v) => setFilters({ waves: v as string[] })} />
        <MultiSelect label="Fuel" options={opts.fuels} value={filters.fuels} onChange={(v) => setFilters({ fuels: v as string[] })} />
        <MultiSelect label="Segment" options={opts.segments} value={filters.segments} onChange={(v) => setFilters({ segments: v as string[] })} />

        <div className="ml-auto flex items-center gap-2">
          {reference && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">Reference:</span>
              <span className="text-foreground">{reference.make} · {reference.key}</span>
              <button onClick={() => setReference(null)} className="ml-1 text-muted-foreground hover:text-destructive">✕</button>
            </div>
          )}
          <Button variant="outline" size="sm" disabled={!active} onClick={() => { resetFilters(); setReference(null); }}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}