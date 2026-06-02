import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { parseExcel } from "@/lib/dashboard/excel";
import { useDashboard } from "@/lib/dashboard/store";
import { REQUIRED_COLUMNS } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Uploader() {
  const dataset = useDashboard((s) => s.dataset);
  const setDataset = useDashboard((s) => s.setDataset);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true); setError(null); setMissing(null);
    const res = await parseExcel(f);
    setBusy(false);
    if (!res.ok || !res.dataset) {
      setError(res.error ?? "Failed to parse file");
      setMissing(res.missingColumns ?? null);
      toast.error(res.error ?? "Upload failed");
      return;
    }
    setDataset(res.dataset);
    toast.success(`Loaded ${res.dataset.rowCount} rows · Updated dashboard`);
  }, [setDataset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          {...getRootProps()}
          className={`flex flex-1 cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-5 transition ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">
              {busy ? "Parsing…" : isDragActive ? "Drop the .xlsx here" : "Drop your Excel file or click to browse"}
            </div>
            <div className="text-xs text-muted-foreground">Only .xlsx — first sheet is used</div>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={busy}>Browse</Button>
        </div>
        {dataset && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold text-foreground">{dataset.fileName}</div>
              <div className="flex items-center gap-1 text-xs text-[color:var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Loaded {dataset.rowCount.toLocaleString()} rows
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">{error}</div>
            {missing && (
              <div className="mt-1 text-xs">Missing columns: <span className="font-mono">{missing.map(m => m === "Market" ? "Market or Channel" : m === "Make" ? "Make or Brand" : m).join(", ")}</span></div>
            )}
          </div>
        </div>
      )}
      {!dataset && !error && (
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Required columns ({REQUIRED_COLUMNS.length})</summary>
          <div className="mt-2 grid grid-cols-2 gap-1 font-mono md:grid-cols-3">
            {REQUIRED_COLUMNS.map((c) => <span key={c}>· {c === "Market" ? "Market or Channel" : c === "Make" ? "Make or Brand" : c}</span>)}
          </div>
        </details>
      )}
    </div>
  );
}