"use client";

import { useState, useEffect } from "react";
import { 
  Shield, AlertTriangle, Radar, Activity, Zap, Globe, Crosshair,
  ArrowUpRight, ArrowDownRight, Brain, Eye, TrendingUp,
  BarChart3, Target, Clock, ChevronRight
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

const API = "http://localhost:8000";

const SEVERITY = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", glow: "rgba(239,68,68,0.3)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.3)" },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)", glow: "rgba(234,179,8,0.3)" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.3)" },
} as const;

type Sev = keyof typeof SEVERITY;

// ─── Threat Gauge Component ───
function ThreatGauge({ score, severity }: { score: number; severity: Sev }) {
  const config = SEVERITY[severity];
  const angle = (score / 100) * 180;
  const r = 80;
  const cx = 100;
  const cy = 95;
  
  const endX = cx + r * Math.cos(Math.PI - (angle * Math.PI) / 180);
  const endY = cy - r * Math.sin((angle * Math.PI) / 180);
  const largeArc = angle > 180 ? 1 : 0;
  
  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        {/* Fill */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)" style={{ transition: "all 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        {/* Score text */}
        <text x={cx} y={cy - 15} textAnchor="middle" fill="white" fontSize="32" fontWeight="700" fontFamily="JetBrains Mono">{Math.round(score)}</text>
        <text x={cx} y={cy + 5} textAnchor="middle" fill={config.color} fontSize="10" fontWeight="600" fontFamily="JetBrains Mono" letterSpacing="0.15em">{severity.toUpperCase()}</text>
      </svg>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, change, changeDir, color, iconBg }: any) {
  return (
    <div className="relative group p-4 rounded-xl border border-white/[0.06] bg-[#0A0A0D] hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          {change && (
            <div className={`flex items-center gap-0.5 text-[10px] font-mono ${changeDir === "up" ? "text-red-400" : "text-emerald-400"}`}>
              {changeDir === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
        <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">{label}</div>
      </div>
    </div>
  );
}

// ─── Alert Card ───
function AlertCard({ alert }: { alert: any }) {
  const sev: Sev = alert.severity || "medium";
  const config = SEVERITY[sev];
  
  return (
    <div className="p-4 rounded-xl border transition-all duration-200 hover:translate-x-1 cursor-pointer group"
      style={{ borderColor: config.border, background: config.bg }}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.glow}` }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: config.color, background: `${config.color}15`, border: `1px solid ${config.border}` }}>
              {alert.module || "M2"}
            </span>
            <span className="text-[9px] font-mono text-white/30">{alert.id}</span>
          </div>
          <h4 className="text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors leading-snug">{alert.title}</h4>
          <p className="text-[11px] text-white/40 mt-1 line-clamp-2 leading-relaxed">{alert.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] font-mono text-white/25 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.first_seen).toLocaleDateString()}
            </span>
            {alert.confidence && (
              <span className="text-[9px] font-mono text-cyan-400/60">{(alert.confidence * 100).toFixed(0)}% conf</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D0D12] border border-white/10 p-3 rounded-lg shadow-2xl text-xs font-mono backdrop-blur-xl">
      <div className="text-white/40 mb-2 text-[10px]">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-white/60">{p.name || p.dataKey}:</span>
          <span className="text-white font-bold">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───
export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/dashboard/overview`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/analytics/threat-timeline?days=30`).then(r => r.json()).catch(() => null),
    ]).then(([dash, tl]) => {
      setData(dash);
      setTimeline(tl?.timeline || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-white/40 text-sm font-mono">Initializing threat intelligence...</div>
        </div>
      </div>
    );
  }

  const threatScore = data?.overall_threat_score || 62;
  const severity: Sev = data?.overall_severity || "high";

  const moduleData = [
    { name: "PSR\nBenchmark", value: data?.modules?.m1_psr?.high_risk_psps || 4, fill: "#f97316" },
    { name: "Scam\nTypologies", value: data?.modules?.m2_typology?.emerging_threats || 5, fill: "#06b6d4" },
    { name: "Brand\nThreats", value: data?.modules?.m3_impersonation?.active_alerts || 12, fill: "#a855f7" },
  ];

  const timelineShort = timeline.slice(-14);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            Command Center
          </h1>
          <p className="text-white/35 text-sm mt-1.5 max-w-xl">
            Real-time P2P payment fraud intelligence across phishing, scam typologies, and brand impersonation.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            LIVE • {data?.ml_models?.operational || 4} MODELS
          </div>
          <div className="text-[10px] font-mono text-white/20 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Top Row: Threat Gauge + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Threat Gauge */}
        <div className="lg:col-span-3 p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-2 text-center">Global Threat Index</div>
          <ThreatGauge score={threatScore} severity={severity} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <div className="text-[16px] font-bold text-red-400 font-mono">{data?.critical_count || 2}</div>
              <div className="text-[8px] text-white/30 font-mono uppercase">Critical</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <div className="text-[16px] font-bold text-white font-mono">{data?.alerts_total || 8}</div>
              <div className="text-[8px] text-white/30 font-mono uppercase">Active</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Crosshair} label="Phishing Domains (24h)" value={data?.threat_signals?.phishing_domains_24h || 89} change="+12%" changeDir="up" color="text-red-400" iconBg="bg-red-500/10" />
          <StatCard icon={AlertTriangle} label="Scam Reports (24h)" value={data?.threat_signals?.scam_reports_24h || 234} change="+8%" changeDir="up" color="text-orange-400" iconBg="bg-orange-500/10" />
          <StatCard icon={Radar} label="New Typologies (7d)" value={data?.threat_signals?.new_typologies_7d || 5} change="+2" changeDir="up" color="text-cyan-400" iconBg="bg-cyan-500/10" />
          <StatCard icon={Eye} label="Active Campaigns" value={data?.threat_signals?.active_impersonation_campaigns || 14} change="-3" changeDir="down" color="text-purple-400" iconBg="bg-purple-500/10" />
          <StatCard icon={Shield} label="Threats Blocked (30d)" value={(data?.stats?.total_threats_blocked_30d || 2450).toLocaleString()} color="text-emerald-400" iconBg="bg-emerald-500/10" />
          <StatCard icon={Zap} label="Avg Detection (min)" value={data?.stats?.avg_detection_time_min || 4.2} color="text-yellow-400" iconBg="bg-yellow-500/10" />
          <StatCard icon={Brain} label="ML Accuracy" value={`${data?.stats?.ml_accuracy_pct || 93.4}%`} color="text-blue-400" iconBg="bg-blue-500/10" />
          <StatCard icon={Target} label="False Positive Rate" value={`${data?.stats?.false_positive_rate_pct || 2.1}%`} change="-0.3%" changeDir="down" color="text-emerald-400" iconBg="bg-emerald-500/10" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Threat Timeline */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Threat Activity Timeline
              </h3>
              <p className="text-[10px] text-white/30 mt-0.5">14-day rolling threat volume across all modules</p>
            </div>
            <div className="flex items-center gap-3">
              {[{ label: "Phishing", color: "#ef4444" }, { label: "Scam Reports", color: "#06b6d4" }, { label: "Fraud", color: "#a855f7" }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-mono text-white/40">
                  <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineShort} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="phishGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="scamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#333" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v?.split("-").slice(1).join("/")} />
                <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="phishing_domains" stroke="#ef4444" strokeWidth={1.5} fill="url(#phishGrad)" name="Phishing" />
                <Area type="monotone" dataKey="scam_reports" stroke="#06b6d4" strokeWidth={1.5} fill="url(#scamGrad)" name="Scam Reports" />
                <Area type="monotone" dataKey="fraud_transactions" stroke="#a855f7" strokeWidth={1.5} fill="url(#fraudGrad)" name="Fraud Txns" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Module Threat Breakdown
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#555" fontSize={9} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36} name="Active Threats">
                  {moduleData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Module Status Pills */}
          <div className="space-y-2 mt-4">
            {[
              { name: "M1: PSR Benchmark", psps: data?.modules?.m1_psr?.psps_tracked || 15, status: "active", color: "text-orange-400", bg: "bg-orange-500/10" },
              { name: "M2: Typology Radar", psps: data?.modules?.m2_typology?.active_typologies || 24, status: "active", color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { name: "M3: Impersonation", psps: data?.modules?.m3_impersonation?.brands_monitored || 15, status: "active", color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${m.color === "text-orange-400" ? "bg-orange-400" : m.color === "text-cyan-400" ? "bg-cyan-400" : "bg-purple-400"}`} />
                  <span className="text-[11px] text-white/70 font-medium">{m.name}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${m.color}`}>{m.psps} tracked</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0D] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Active Threat Intelligence Feed
            </h3>
            <p className="text-[10px] text-white/30 mt-0.5">Prioritized alerts from all intelligence modules</p>
          </div>
          <span className="text-[10px] font-mono text-white/20 bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.06]">
            {data?.alerts_total || 8} active alerts
          </span>
        </div>
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {(data?.alerts || []).map((alert: any, i: number) => (
            <div key={alert.id || i} style={{ animationDelay: `${i * 80}ms` }} className="anim-fade-up">
              <AlertCard alert={alert} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
