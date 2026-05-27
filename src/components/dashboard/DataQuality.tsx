import { useMemo, useState } from "react";
import type { Row } from "@/lib/dashboard/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const buckets: { key: string; label: string; match: (r: Row) => boolean; severity: "warn" | "error" }[] = [
  { key: "both", label: "Both BF & LS populated", match: (r) => r.issues.includes("Both BF and LS columns have data"), severity: "warn" },
  { key: "neither", label: "Neither BF nor LS populated", match: (r) => r.issues.includes("No finance fields (BF nor LS) have data"), severity: "warn" },
  { key: "missingTp", label: "Missing Transaction Price", match: (r) => r.issues.includes("Missing Transaction Price"), severity: "error" },
  { key: "missingKey", label: "Missing Make/Model/Market/Year/Month", match: (r) => r.issues.includes("Missing Make/Model/Market/Year/Month"), severity: "error" },
  { key: "invalidDate", label: "Invalid Year/Month", match: (r) => r.issues.includes("Invalid Year/Month"), severity: "warn" },
  { key: "duplicate", label: "Duplicate VisitCode", match: (r) => r.issues.includes("Duplicate VisitCode"), severity: "warn" },
];

export function DataQuality({ rows }: { rows: Row[] }) {
  const [openBucket, setOpenBucket] = useState<string | null>(null);
  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.issues.length === 0).length;
    const errors = rows.filter((r) => r.issues.some((i) => i.startsWith("Missing"))).length;
    const warnings = rows.filter((r) => r.issues.length > 0).length - errors;
    return { valid, errors, warnings: Math.max(0, warnings) };
  }, [rows]);

  const bucketRows = openBucket ? rows.filter((r) => buckets.find((b) => b.key === openBucket)!.match(r)) : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Data quality</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1 text-[color:var(--success)]"><CheckCircle2 className="h-3.5 w-3.5" />{stats.valid} valid</span>
          <span className="inline-flex items-center gap-1 text-[color:var(--warning)]"><AlertTriangle className="h-3.5 w-3.5" />{stats.warnings} warnings</span>
          <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" />{stats.errors} errors</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {buckets.map((b) => {
          const count = rows.filter(b.match).length;
          return (
            <div key={b.key} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">{b.label}</div>
                <div className={`text-xs ${b.severity === "error" ? "text-destructive" : "text-[color:var(--warning)]"}`}>{count} rows</div>
              </div>
              <Dialog open={openBucket === b.key} onOpenChange={(o) => setOpenBucket(o ? b.key : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!count}>View</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>{b.label} · {count} rows</DialogTitle></DialogHeader>
                  <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr><th className="px-3 py-2 text-left">VisitCode</th><th className="px-3 py-2 text-left">Market</th><th className="px-3 py-2 text-left">Make</th><th className="px-3 py-2 text-left">Model</th><th className="px-3 py-2 text-left">Wave</th><th className="px-3 py-2 text-left">Issues</th></tr>
                      </thead>
                      <tbody>
                        {bucketRows.slice(0, 500).map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-1.5 font-mono">{r.visitCode || "—"}</td>
                            <td className="px-3 py-1.5">{r.market}</td>
                            <td className="px-3 py-1.5">{r.make}</td>
                            <td className="px-3 py-1.5">{r.model}</td>
                            <td className="px-3 py-1.5">{r.wave ?? "—"}</td>
                            <td className="px-3 py-1.5 text-destructive">{r.issues.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}