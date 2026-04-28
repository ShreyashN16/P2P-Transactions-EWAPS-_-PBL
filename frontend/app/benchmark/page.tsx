"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:8000";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D0D12] border border-white/10 p-3 rounded-lg shadow-2xl text-xs font-mono">
      <div className="text-white/40 mb-2">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-bold">{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#10b981",
};

export default function BenchmarkPage() {
  const [data, setData] = useState<any>(null);
  const [selectedPsp, setSelectedPsp] = useState<string | null>(null);
  const [pspDetail, setPspDetail] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/m1/psr/benchmark`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPsp) {
      fetch(`${API}/api/m1/psr/psp/${encodeURIComponent(selectedPsp)}`)
        .then(r => r.json())
        .then(d => setPspDetail(d))
        .catch(console.error);
    }
  }, [selectedPsp]);

  const psps = data?.psps || [];
  const chartData = psps.slice(0, 10).map((p: any) => ({
    name: p.psp.length > 12 ? p.psp.slice(0, 12) + "…" : p.psp,
    fullName: p.psp,
    zscore: p.z_score,
    fraud_sent: p.fraud_sent_per_mn,
    severity: p.severity,
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-orange-400" />
            PSR Benchmark
          </h1>
          <p className="text-white/35 text-sm mt-1.5">Payment Systems Regulator — APP fraud performance comparison across PSPs.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            Q: {data?.latest_quarter || "—"}
          </span>
          <span className="text-[10px] font-mono text-orange-400 bg-orange-500/5 px-3 py-1.5 rounded-lg border border-orange-500/15">
            {data?.high_risk_count || 0} high risk
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "PSPs Tracked", value: data?.total_psps || 15, color: "text-white" },
          { label: "Peer Median Fraud/£M", value: data?.peer_median_fraud_sent?.toFixed(0) || "—", color: "text-orange-400" },
          { label: "Avg Reimburse Rate", value: `${data?.peer_mean_reimburse?.toFixed(0) || "—"}%`, color: "text-cyan-400" },
          { label: "High Risk PSPs", value: data?.high_risk_count || 0, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-white/[0.06] bg-[#0A0A0D] text-center">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/30 mt-0.5 font-mono uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Z-Score Chart */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            Fraud Sent per £M — Z-Score vs Peer Group
          </h3>
          <p className="text-[10px] text-white/30 mt-0.5">Higher z-score = more fraud relative to peers. Bars colored by severity.</p>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="#555" fontSize={9} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
              <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} label={{ value: "Z-Score (σ)", angle: -90, position: "insideLeft", fill: "#555", fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="zscore" radius={[4, 4, 0, 0]} barSize={28} name="Z-Score (σ)">
                {chartData.map((entry: any, i: number) => (
                  <Cell key={i} fill={SEVERITY_COLOR[entry.severity] || "#eab308"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PSP Table */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0A0A0D] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white">PSP Performance Table</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["#", "PSP", "Fraud/£M Sent", "Reimb. %", "Z-Score", "Severity"].map(h => (
                  <th key={h} className="text-[9px] font-mono text-white/25 uppercase tracking-wider text-left px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {psps.map((psp: any, i: number) => {
                const sevColor = SEVERITY_COLOR[psp.severity] || "#eab308";
                return (
                  <tr
                    key={psp.psp}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedPsp === psp.psp ? "bg-white/[0.04]" : ""}`}
                    onClick={() => setSelectedPsp(psp.psp)}
                  >
                    <td className="px-4 py-2.5 text-[10px] font-mono text-white/20">{psp.peer_rank}</td>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-white/80">{psp.psp}</td>
                    <td className="px-4 py-2.5 text-[12px] font-mono text-white/60">{psp.fraud_sent_per_mn.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-[12px] font-mono text-white/60">{psp.pct_fully_reimbursed.toFixed(0)}%</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-mono font-bold" style={{ color: sevColor }}>
                        {psp.z_score > 0 ? "+" : ""}{psp.z_score.toFixed(2)}σ
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold" style={{ color: sevColor, background: `${sevColor}12`, border: `1px solid ${sevColor}30` }}>
                        {psp.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PSP Detail Panel */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0D] p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            {selectedPsp ? `${selectedPsp} Detail` : "Select a PSP"}
          </h3>
          
          {pspDetail ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-white/30 uppercase">Trend</span>
                  <div className="flex items-center gap-1">
                    {pspDetail.trend_direction === "rising" ? (
                      <ArrowUpRight className="w-3 h-3 text-red-400" />
                    ) : pspDetail.trend_direction === "falling" ? (
                      <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Minus className="w-3 h-3 text-white/40" />
                    )}
                    <span className={`text-[11px] font-mono font-bold ${pspDetail.trend_direction === "rising" ? "text-red-400" : pspDetail.trend_direction === "falling" ? "text-emerald-400" : "text-white/40"}`}>
                      {pspDetail.trend_pct > 0 ? "+" : ""}{pspDetail.trend_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-white/40 capitalize">{pspDetail.trend_direction} quarter-on-quarter</span>
              </div>

              <div className="text-[9px] font-mono text-white/25 uppercase">Quarterly History</div>
              <div className="space-y-2">
                {(pspDetail.history || []).map((h: any) => (
                  <div key={h.quarter} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[11px] font-mono text-white/50">{h.quarter}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-white/40">Fraud: <strong className="text-white/70">{h.fraud_sent_per_mn.toFixed(0)}</strong></span>
                      <span className="text-[10px] font-mono text-white/40">Reimb: <strong className="text-cyan-400">{h.pct_fully_reimbursed.toFixed(0)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-[11px] text-white/25">Click a PSP row to view quarterly detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
