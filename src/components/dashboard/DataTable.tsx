import { useMemo, useState } from "react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  flexRender, useReactTable, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import type { Row } from "@/lib/dashboard/types";
import { fmtEur, fmtNum } from "@/lib/dashboard/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, ArrowUpDown } from "lucide-react";

const columns: ColumnDef<Row>[] = [
  { accessorKey: "market", header: "Market" },
  { accessorKey: "year", header: "Year" },
  { accessorKey: "month", header: "Month" },
  { accessorKey: "wave", header: "Wave" },
  { accessorKey: "segment", header: "Segment" },
  { accessorKey: "make", header: "Make" },
  { accessorKey: "model", header: "Model" },
  { accessorKey: "modelMarket", header: "Model Market" },
  { accessorKey: "fuelType", header: "Fuel" },
  { accessorKey: "financeType", header: "Finance" },
  { accessorKey: "transactionPrice", header: "TP", cell: (c) => fmtEur(c.getValue<number | null>()) },
  { accessorKey: "monthlyPayment", header: "MP", cell: (c) => fmtEur(c.getValue<number | null>()) },
  { accessorKey: "deposit", header: "Deposit", cell: (c) => fmtEur(c.getValue<number | null>()) },
  { accessorKey: "contractMonths", header: "Months", cell: (c) => fmtNum(c.getValue<number | null>()) },
  { accessorKey: "discount", header: "DSC %", cell: (c) => { const v = c.getValue<number | null>(); return v === null ? "—" : `${v.toFixed(1)}%`; } },
  { accessorKey: "equipment", header: "Equipment", cell: (c) => fmtEur(c.getValue<number | null>()) },
  { accessorKey: "visitCode", header: "VisitCode" },
  { id: "issues", header: "Flags", accessorFn: (r) => r.issues.join("; "), cell: (c) => {
    const v = c.getValue<string>();
    return v ? <span className="text-xs text-destructive">{v}</span> : <span className="text-xs text-[color:var(--success)]">OK</span>;
  } },
];

function exportCsv(rows: Row[]) {
  const head = ["Market","Year","Month","Wave","Segment","Make","Model","Model Market","Fuel","Finance","Transaction Price","Monthly Payment","Deposit","Contract Months","Discount","Equipment","VisitCode","Flags"];
  const lines = [head.join(",")];
  for (const r of rows) {
    const cells = [r.market, r.year, r.month, r.wave, r.segment, r.make, r.model, r.modelMarket, r.fuelType, r.financeType, r.transactionPrice, r.monthlyPayment, r.deposit, r.contractMonths, r.discount, r.equipment, r.visitCode, r.issues.join("; ")];
    lines.push(cells.map((v) => { const s = v === null || v === undefined ? "" : String(v); return /[,\"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "dashboard_export.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function DataTable({ rows }: { rows: Row[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [colVis, setColVis] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter, columnVisibility: colVis },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColVis,
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredRows = useMemo(() => table.getSortedRowModel().rows.map((r) => r.original), [table, sorting, globalFilter]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">Detailed observations</h3>
        <span className="text-xs text-muted-foreground">{rows.length.toLocaleString()} rows</span>
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Search…" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="h-9 w-56" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Columns <ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
              {table.getAllLeafColumns().map((c) => (
                <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>
                  {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => exportCsv(filteredRows)}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="cursor-pointer whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" onClick={h.column.getToggleSortingHandler()}>
                    <span className="inline-flex items-center gap-1">{flexRender(h.column.columnDef.header, h.getContext())}<ArrowUpDown className="h-3 w-3 opacity-40" /></span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="whitespace-nowrap px-3 py-2 text-foreground">{flexRender(c.column.columnDef.cell ?? ((ctx) => String(ctx.getValue() ?? "—")), c.getContext())}</td>
                ))}
              </tr>
            ))}
            {!table.getRowModel().rows.length && (
              <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">No rows match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
}