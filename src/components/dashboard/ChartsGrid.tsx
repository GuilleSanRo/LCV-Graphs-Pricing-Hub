import { useState } from "react";
import type { Row } from "@/lib/dashboard/types";
import { mean, groupBy, fmtEur } from "@/lib/dashboard/utils";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, Cell } from "recharts";
import { Switch } from "@/components/ui/switch";
function Card({ title, sub, children, empty }: { title: string; sub?: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {empty ? <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Not enough data to display.</div> : <div className="h-64 w-full">{children}</div>}
    </div>
  );
}

function byKey<T extends string>(rows: Row[], key: (r: Row) => T, val: (r: Row) => number | null) {
  return Array.from(groupBy(rows, key).entries())
    .map(([k, rs]) => ({ name: k, value: mean(rs.map(val)) ?? 0 }))
    .filter((d) => d.value !== 0)
    .sort((a, b) => b.value - a.value);
}

const fillVar = "var(--primary)";

export function ChartsGrid({ rows, evolutionRows }: { rows: Row[], evolutionRows?: Row[] }) {
  const [groupMode, setGroupMode] = useState<"make" | "group">("make");

  function getMakeOrGroup(make: string) {
    const makeUpper = make.toUpperCase();
    const isStellantis = ["FIAT", "CITROEN", "PEUGEOT", "OPEL/VAUXHALL", "OPEL"].includes(makeUpper);
    if (groupMode === "group" && isStellantis) {
      return "STELLANTIS";
    }
    if (makeUpper === "OPEL/VAUXHALL") {
      return "OPEL";
    }
    return make;
  }

  const tpByMake = byKey(rows, (r) => getMakeOrGroup(r.make), (r) => r.transactionPrice);
  const mpByMake = byKey(rows, (r) => getMakeOrGroup(r.make), (r) => r.monthlyPayment);
  const dscByMake = byKey(rows, (r) => getMakeOrGroup(r.make), (r) => r.discount);

  const evolRows = evolutionRows || rows;
  const evolution = Array.from(groupBy(evolRows.filter((r) => r.wave), (r) => r.wave as string).entries())
    .map(([wave, rs]) => ({ wave, value: mean(rs.map((r) => r.monthlyPayment)) ?? 0 }))
    .sort((a, b) => a.wave.localeCompare(b.wave));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <div>
          <div className="text-sm font-semibold text-foreground">Summary charts grouping</div>
          <div className="text-xs text-muted-foreground">Toggle to group Fiat, Citroen, Peugeot, and Opel into Stellantis.</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Match by</span>
          <div className="flex items-center gap-2 text-xs">
            <span className={groupMode === "make" ? "font-semibold text-foreground" : "text-muted-foreground"}>Make/Brand</span>
            <Switch checked={groupMode === "group"} onCheckedChange={(c) => setGroupMode(c ? "group" : "make")} />
            <span className={groupMode === "group" ? "font-semibold text-foreground" : "text-muted-foreground"}>Group</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Transaction Price" sub="avg" empty={!tpByMake.length}>
          <ResponsiveContainer><BarChart data={tpByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{tpByMake.map((entry, index) => <Cell key={`cell-${index}`} fill={index === tpByMake.length - 1 ? "#d4af37" : index === tpByMake.length - 2 ? "#c0c0c0" : "#0000ff"} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Discount" sub="avg %" empty={!dscByMake.length}>
          <ResponsiveContainer><BarChart data={dscByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => `${v.toFixed(0)}%`} /><RTooltip formatter={(v: number) => `${v.toFixed(2)}%`} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{dscByMake.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? "#d4af37" : index === 1 ? "#c0c0c0" : "#0000ff"} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Monthly Payment" sub="avg" empty={!mpByMake.length}>
          <ResponsiveContainer><BarChart data={mpByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{mpByMake.map((entry, index) => <Cell key={`cell-${index}`} fill={index === mpByMake.length - 1 ? "#d4af37" : index === mpByMake.length - 2 ? "#c0c0c0" : "#0000ff"} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Monthly Payment Over Time" sub="Avg by Wave" empty={evolution.length < 2}>
          <ResponsiveContainer><LineChart data={evolution}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="wave" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Line type="monotone" dataKey="value" stroke={fillVar} strokeWidth={2} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}