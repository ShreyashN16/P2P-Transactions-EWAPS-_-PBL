"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, ChevronRight, Filter, ExternalLink, Shield } from "lucide-react";

const API = "http://localhost:8000";

const SEVERITY: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.2)" },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.2)" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
};

export default function ThreatsPage() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/dashboard/overview`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  const alerts = data?.alerts || [];
  const filtered = filter === "all" ? alerts : alerts.filter((a: any) => a.severity === filter);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            Threat Feed
          </h1>
          <p className="text-white/35 text-sm mt-1.5">Prioritized threat intelligence from all detection modules.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {["all", "critical", "high", "medium"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                filter === f 
                  ? "bg-white/10 text-white border border-white/20" 
                  : "text-white/40 hover:text-white/60 border border-transparent hover:border-white/10"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Active", value: alerts.length, color: "text-white" },
          { label: "Critical", value: alerts.filter((a: any) => a.severity === "critical").length, color: "text-red-400" },
          { label: "High", value: alerts.filter((a: any) => a.severity === "high").length, color: "text-orange-400" },
          { label: "Medium", value: alerts.filter((a: any) => a.severity === "medium").length, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-white/[0.06] bg-[#0A0A0D] text-center">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/30 mt-0.5 font-mono uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert: any, i: number) => {
          const sev = SEVERITY[alert.severity] || SEVERITY.medium;
          const isExpanded = expandedId === alert.id;

          return (
            <div
              key={alert.id}
              className="rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer"
              style={{ borderColor: sev.border, background: sev.bg }}
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: sev.color, boxShadow: `0 0 10px ${sev.color}40` }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ color: sev.color, background: `${sev.color}15`, border: `1px solid ${sev.border}` }}>
                        {alert.severity}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400/60 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">{alert.module}</span>
                      <span className="text-[9px] font-mono text-white/20">{alert.category}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-white/90">{alert.title}</h3>
                    <p className="text-[12px] text-white/45 mt-2 leading-relaxed">{alert.description}</p>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 anim-fade-up">
                        {alert.impact && (
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Impact Assessment</div>
                            <p className="text-[12px] text-white/70">{alert.impact}</p>
                          </div>
                        )}
                        {alert.recommended_actions && (
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <div className="text-[9px] font-mono text-white/30 uppercase mb-2">Recommended Actions</div>
                            <ul className="space-y-1.5">
                              {alert.recommended_actions.map((action: string, j: number) => (
                                <li key={j} className="flex items-start gap-2 text-[12px] text-white/60">
                                  <span className="text-cyan-400/60 mt-0.5">→</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-mono text-white/25">
                          {alert.confidence && <span>Confidence: <strong className="text-white/50">{(alert.confidence * 100).toFixed(0)}%</strong></span>}
                          {alert.domains_flagged && <span>Domains: <strong className="text-white/50">{alert.domains_flagged}</strong></span>}
                          {alert.z_score && <span>Z-Score: <strong className="text-white/50">{alert.z_score}σ</strong></span>}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-mono text-white/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.first_seen).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
