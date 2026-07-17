import { useDashboard } from "@/lib/dashboard/store";

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

export function Header() {
  const filters = useDashboard((s) => s.filters);
  const reference = useDashboard((s) => s.reference);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm overflow-hidden">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
        </div>
        <div className="mr-4">
          <div className="text-base font-bold leading-tight text-foreground">Stellantis ProOne LCV Graphs</div>
          <div className="text-xs text-muted-foreground">promoCAR Mystery Shopping Pricing Dashboard</div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {filters.waves.length > 0 && <Pill label="Wave" value={filters.waves.length > 2 ? `${filters.waves.length} selected` : filters.waves.join(", ")} />}
          {filters.markets.length > 0 && <Pill label="Market" value={filters.markets.length > 2 ? `${filters.markets.length} selected` : filters.markets.join(", ")} />}
          {filters.fuels.length > 0 && <Pill label="Fuel" value={filters.fuels.join(", ")} />}
          {reference && <Pill label="Base" value={`${reference.make} · ${reference.key}`} />}
        </div>
      </div>
    </header>
  );
}