"use client";

import { useState, useEffect } from "react";
import { Crosshair, Globe, ExternalLink, AlertTriangle, Shield, Search, Clock, Filter } from "lucide-react";

const API = "http://localhost:8000";

const TIERS: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.15)" },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.15)" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.15)" },
};

export default function PhishingPage() {
  const [domain, setDomain] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [filterTier, setFilterTier] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/m3/impersonation/alerts?limit=30`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/m3/brands/summary`).then(r => r.json()).catch(() => null),
    ]).then(([a, b]) => {
      setAlerts(a?.alerts || []);
      setBrands(b?.brands || []);
    });
  }, []);

  const handleScan = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API}/api/scan/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      setScanResult({ error: "Scan failed" });
    }
    setScanning(false);
  };

  const filteredAlerts = filterTier === "all" ? alerts : alerts.filter(a => a.tier === filterTier);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-red-400" />
            Phishing & Impersonation Monitor
          </h1>
          <p className="text-white/35 text-sm mt-1.5">Brand impersonation watchtower — domain monitoring, phishing detection, and URL scanning.</p>
        </div>
      </div>

      {/* URL Scanner */}
      <div className="p-5 rounded-xl border border-cyan-500/15 bg-gradient-to-r from-cyan-500/[0.03] to-blue-500/[0.03]">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">Live URL Scanner</span>
          <span className="text-[9px] font-mono text-white/25 ml-2">Powered by trained LightGBM phishing model</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter URL to scan (e.g., monzo-support-refund.top/verify)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-all"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            {scanning ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Scan
          </button>
        </div>

        {scanResult && !scanResult.error && (
          <div className={`mt-4 p-4 rounded-lg border ${scanResult.is_phishing ? "border-red-500/20 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${scanResult.is_phishing ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"}`} />
              <span className={`text-lg font-bold font-mono ${scanResult.is_phishing ? "text-red-400" : "text-emerald-400"}`}>
                {scanResult.verdict}
              </span>
              <span className="text-[10px] font-mono text-white/30 ml-auto">
                Risk Score: <strong className="text-white/60">{scanResult.risk_score}/100</strong>
              </span>
            </div>
            <div className="text-[12px] font-mono text-white/40">
              Confidence: {(scanResult.confidence * 100).toFixed(1)}% • {scanResult.features_analyzed} features analyzed
            </div>
            {scanResult.top_signals && (
              <div className="mt-3 flex flex-wrap gap-2">
                {scanResult.top_signals.slice(0, 5).map((s: any, i: number) => (
                  <span key={i} className="text-[9px] font-mono bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06] text-white/50">
                    {s.feature}: {typeof s.importance === "number" ? s.importance.toFixed(3) : s.importance}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brand Overview Grid */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Monitored Brands ({brands.length})
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
          {brands.slice(0, 15).map((brand: any) => {
            const risk = TIERS[brand.risk_level] || TIERS.low;
            return (
              <div key={brand.name} className="p-3 rounded-lg border border-white/[0.06] bg-[#0A0A0D] hover:border-white/[0.12] transition-all group cursor-pointer text-center">
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-[12px] font-bold" style={{ backgroundColor: `${brand.color}15`, color: brand.color, border: `1px solid ${brand.color}30` }}>
                  {brand.logo_letter}
                </div>
                <div className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">{brand.name}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.color }} />
                  <span className="text-[9px] font-mono" style={{ color: risk.color }}>{brand.active_threats} threats</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Alerts */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0D] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Suspicious Domains Detected
            </h3>
            <p className="text-[10px] text-white/30 mt-0.5">Recently flagged impersonation domains</p>
          </div>
          <div className="flex gap-1">
            {["all", "critical", "high", "medium"].map(f => (
              <button
                key={f}
                onClick={() => setFilterTier(f)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${filterTier === f ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"}`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Risk", "Domain", "Brand", "Age", "Registrar", "Signals", "Status"].map(h => (
                  <th key={h} className="text-[9px] font-mono text-white/25 uppercase tracking-wider text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.slice(0, 20).map((alert: any) => {
                const tier = TIERS[alert.tier] || TIERS.medium;
                return (
                  <tr key={alert.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase" style={{ color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}>
                        {alert.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono text-white/70">{alert.domain}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-white/50 capitalize">{alert.brand}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-mono ${alert.domain_age_days < 7 ? "text-red-400" : "text-white/40"}`}>
                        {alert.domain_age_days}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-white/30">{alert.registrar}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {alert.signals.slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono ${alert.status === "active" ? "text-red-400" : "text-emerald-400"}`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
