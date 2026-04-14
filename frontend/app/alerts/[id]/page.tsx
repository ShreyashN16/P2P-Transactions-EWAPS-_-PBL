"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_ALERTS, SEVERITY_CONFIG } from "../../../lib/mockData";
import { ArrowLeft, CheckCircle2, ShieldAlert, Zap, Clock, TrendingDown } from "lucide-react";

export default function AlertDetailsPage() {
  const params = useParams();
  const alertId = params.id as string;
  const alert = MOCK_ALERTS.find(a => a.id === alertId) || MOCK_ALERTS[0]; // fallback to first mock if not found

  if (!alert) {
    return <div className="p-8 text-center text-white/50">Alert not found</div>;
  }

  const config = SEVERITY_CONFIG[alert.severity];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/alerts" className="inline-flex items-center gap-2 text-xs font-medium text-white/40 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Alerts
      </Link>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between border-b border-white/5 pb-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-white/50">
                {alert.id}
              </div>
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}` }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                {config.label}
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-medium text-white leading-tight">
              {alert.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(alert.timestamp).toLocaleString("en-IN", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
                })}
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {alert.area}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5 flex flex-col min-w-[200px]">
            <span className="text-xs text-white/40 mb-1">Estimated Impact</span>
            <span className="text-3xl font-mono font-bold text-white mb-2">₹{((alert.predicted_impact_inr || alert.impact || 0) / 100000).toFixed(1)}<span className="text-xl text-white/50">L</span></span>
            <div className="flex items-center gap-2 text-xs">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <span className="text-white/60">Risk Probability: <span className="font-medium text-white">{(alert.confidence * 100).toFixed(0)}%</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                AI Analysis & Explanation
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {alert.explanation}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Recommended Actions
              </h3>
              <ul className="space-y-3">
                {alert.recommended_actions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/70 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
                    <span className="font-mono text-orange-500/70">{i + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
              <h4 className="text-xs font-semibold text-white/90 uppercase tracking-widest mb-4">Signal Contributors</h4>
              <div className="space-y-3">
                {[
                  { name: "Vendor Delivery Data", weight: 65 },
                  { name: "Quality Defect Logs", weight: 25 },
                  { name: "Market News", weight: 10 }
                ].map(sig => (
                  <div key={sig.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{sig.name}</span>
                      <span className="text-white font-mono">{sig.weight}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500/80 rounded-full" style={{ width: `${sig.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Resolve Alert
            </button>
            <button className="w-full py-2.5 rounded-lg bg-transparent border border-white/10 text-white hover:bg-white/5 font-medium text-sm transition-colors">
              Assign to Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
