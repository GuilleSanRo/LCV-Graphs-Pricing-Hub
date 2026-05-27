import type { Row } from "@/lib/dashboard/types";
import { mean, groupBy, fmtEur } from "@/lib/dashboard/utils";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";

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

export function ChartsGrid({ rows }: { rows: Row[] }) {
  const tpByMake = byKey(rows, (r) => r.make, (r) => r.transactionPrice);
  const mpByMake = byKey(rows, (r) => r.make, (r) => r.monthlyPayment);
  const dscByMake = byKey(rows, (r) => r.make, (r) => r.discount);
  const segOverview = byKey(rows, (r) => r.segment, (r) => r.transactionPrice);

  const evolution = Array.from(groupBy(rows.filter((r) => r.wave), (r) => r.wave as string).entries())
    .map(([wave, rs]) => ({ wave, tp: mean(rs.map((r) => r.transactionPrice)) ?? 0 }))
    .sort((a, b) => a.wave.localeCompare(b.wave));

  const fuels = ["BEV", "ICE"];
  const fuelData = fuels.map((f) => {
    const rs = rows.filter((r) => r.fuelType === f);
    return {
      name: f,
      "Transaction Price": mean(rs.map((r) => r.transactionPrice)) ?? 0,
      "Monthly Payment": mean(rs.map((r) => r.monthlyPayment)) ?? 0,
      "Discount %": mean(rs.map((r) => r.discount)) ?? 0,
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Transaction Price by Make" sub="avg" empty={!tpByMake.length}>
        <ResponsiveContainer><BarChart data={tpByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Bar dataKey="value" fill={fillVar} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Monthly Payment by Make" sub="avg" empty={!mpByMake.length}>
        <ResponsiveContainer><BarChart data={mpByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Discount by Make" sub="avg %" empty={!dscByMake.length}>
        <ResponsiveContainer><BarChart data={dscByMake}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => `${v.toFixed(0)}%`} /><RTooltip formatter={(v: number) => `${v.toFixed(2)}%`} /><Bar dataKey="value" fill="var(--chart-4)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Price Evolution Over Time" sub="avg Transaction Price by Wave" empty={evolution.length < 2}>
        <ResponsiveContainer><LineChart data={evolution}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="wave" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Line type="monotone" dataKey="tp" stroke={fillVar} strokeWidth={2} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
      </Card>
      <Card title="BEV vs ICE Comparison" sub="avg metrics" empty={!fuelData.some((d) => d["Transaction Price"])}>
        <ResponsiveContainer><BarChart data={fuelData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} /><RTooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Transaction Price" fill="var(--primary)" radius={[6, 6, 0, 0]} /><Bar dataKey="Monthly Payment" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /><Bar dataKey="Discount %" fill="var(--chart-4)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Segment Overview" sub="avg Transaction Price" empty={!segOverview.length}>
        <ResponsiveContainer><BarChart data={segOverview}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtEur(v)} /><RTooltip formatter={(v: number) => fmtEur(v)} /><Bar dataKey="value" fill="var(--chart-3)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </Card>
    </div>
  );
}