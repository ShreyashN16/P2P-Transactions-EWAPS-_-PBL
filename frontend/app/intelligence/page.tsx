"use client";

import { useState, useEffect } from "react";
import { Radar, TrendingUp, ArrowUpRight, Zap, Eye, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://localhost:8000";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D0D12] border border-white/10 p-3 rounded-lg shadow-2xl text-xs font-mono backdrop-blur-xl">
      <div className="text-white/40 mb-2 text-[10px]">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function IntelligencePage() {
  const [radar, setRadar] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/m2/typology/radar`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/m2/typology/trends`).then(r => r.json()).catch(() => null),
    ]).then(([r, t]) => {
      setRadar(r);
      setTrends(t);
    });
  }, []);

  const typologies = radar?.typologies || [];
  
  // Format trend data for chart
  const trendChart = (trends?.weeks || []).map((week: string, i: number) => {
    const row: any = { week: week.split("-W")[1] ? `W${week.split("-W")[1]}` : week };
    if (trends?.trends) {
      Object.entries(trends.trends).forEach(([key, values]: [string, any]) => {
        row[key] = values[i];
      });
    }
    return row;
  });

  const statusColors: Record<string, { color: string; bg: string }> = {
    emerging: { color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
    growing: { color: "#f97316", bg: "rgba(249,115,22,0.08)" },
    active: { color: "#eab308", bg: "rgba(234,179,8,0.08)" },
    established: { color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
    persistent: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <Radar className="w-6 h-6 text-cyan-400" />
            Scam Typology Radar
          </h1>
          <p className="text-white/35 text-sm mt-1.5">Emerging and evolving P2P payment fraud typologies detected via NLP + topic modeling.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            {radar?.total_typologies || 7} typologies tracked
          </span>
          <span className="text-[10px] font-mono text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/15">
            {radar?.emerging_count || 2} emerging
          </span>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Scam Type Volume Trends (13 weeks)
            </h3>
            <p className="text-[10px] text-white/30 mt-0.5">Complaint volume by scam category over time</p>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {[
                  { id: "romance", color: "#f43f5e" },
                  { id: "investment", color: "#f97316" },
                  { id: "job", color: "#eab308" },
                  { id: "impersonation", color: "#06b6d4" },
                ].map(g => (
                  <linearGradient key={g.id} id={`${g.id}Grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={g.color} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="week" stroke="#333" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="romance_scam" stroke="#f43f5e" strokeWidth={1.5} fill="url(#romanceGrad)" name="Romance" />
              <Area type="monotone" dataKey="investment_fraud" stroke="#f97316" strokeWidth={1.5} fill="url(#investmentGrad)" name="Investment" />
              <Area type="monotone" dataKey="job_scam" stroke="#eab308" strokeWidth={1.5} fill="url(#jobGrad)" name="Job Scam" />
              <Area type="monotone" dataKey="impersonation_scam" stroke="#06b6d4" strokeWidth={1.5} fill="url(#impersonationGrad)" name="Impersonation" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Typology Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {typologies.map((t: any, idx: number) => {
          const status = statusColors[t.status] || statusColors.active;
          const isExpanded = selected === idx;

          return (
            <div
              key={t.topic_id}
              className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D] hover:border-white/[0.12] transition-all cursor-pointer group"
              onClick={() => setSelected(isExpanded ? null : idx)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}30` }}>
                    {t.status}
                  </span>
                  <span className="text-[9px] font-mono text-white/20">T-{t.topic_id}</span>
                </div>
                <div className="flex items-center gap-1 text-red-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-mono font-bold">+{t.velocity_4w_pct}%</span>
                </div>
              </div>

              <h3 className="text-[15px] font-semibold text-white/90 mb-2 group-hover:text-white transition-colors">{t.label}</h3>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                  <Eye className="w-3 h-3" />
                  {t.volume_30d} reports/30d
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                  <Zap className="w-3 h-3" />
                  Novelty: {(t.novelty_score * 100).toFixed(0)}%
                </div>
              </div>

              {/* Brands affected */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.brands_affected.map((brand: string) => (
                  <span key={brand} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50 border border-white/[0.06]">
                    {brand}
                  </span>
                ))}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] anim-fade-up">
                  <div className="text-[9px] font-mono text-white/25 uppercase mb-2">Exemplar Phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.exemplar_phrases.map((phrase: string) => (
                      <span key={phrase} className="text-[10px] font-mono text-cyan-400/60 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 italic">
                        &ldquo;{phrase}&rdquo;
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-white/20">
                    <Clock className="w-3 h-3" />
                    First seen: {t.first_seen}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complaint Breakdown */}
      {radar?.complaint_distribution && Object.keys(radar.complaint_distribution).length > 0 && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
          <h3 className="text-sm font-bold text-white mb-4">CFPB Complaint Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(radar.complaint_distribution).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: [string, any]) => (
              <div key={type} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                <div className="text-lg font-bold text-white font-mono">{count}</div>
                <div className="text-[9px] text-white/30 mt-0.5 font-mono capitalize">{type.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
