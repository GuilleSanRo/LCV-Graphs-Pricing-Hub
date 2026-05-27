import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Header } from "@/components/dashboard/Header";
import { Uploader } from "@/components/dashboard/Uploader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { SegmentSections } from "@/components/dashboard/SegmentSections";
import { ChartsGrid } from "@/components/dashboard/ChartsGrid";
import { DataTable } from "@/components/dashboard/DataTable";
import { DataQuality } from "@/components/dashboard/DataQuality";
import { useDashboard, applyFilters } from "@/lib/dashboard/store";
import { Toaster } from "@/components/ui/sonner";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stellantis ProOne LCV Graphs" },
      { name: "description", content: "promoCAR Mystery Shopping pricing dashboard for LCV transaction prices, monthly payments, discounts and equipment — driven by your uploaded Excel file." },
      { property: "og:title", content: "Stellantis ProOne LCV Graphs" },
      { property: "og:description", content: "Interactive LCV pricing analysis dashboard." },
    ],
  }),
  component: Index,
});

function Index() {
  const dataset = useDashboard((s) => s.dataset);
  const filters = useDashboard((s) => s.filters);
  const filteredRows = useMemo(() => (dataset ? applyFilters(dataset.rows, filters) : []), [dataset, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1400px] space-y-5 px-6 py-6">
        <Uploader />
        {!dataset ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">No dataset yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Drop a Stellantis LCV pricing Excel above (.xlsx). Filters, KPI cards, segment cards, charts and the detailed table will populate automatically.
            </p>
          </div>
        ) : (
          <>
            <FilterBar />
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-16 text-center text-sm text-muted-foreground shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
                No data for the selected filters.
              </div>
            ) : (
              <>
                <KpiCards rows={filteredRows} />
                <SegmentSections rows={filteredRows} />
                <ChartsGrid rows={filteredRows} />
                <DataTable rows={filteredRows} />
              </>
            )}
            <DataQuality rows={dataset.rows} />
          </>
        )}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
