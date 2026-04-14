"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Alert, SEVERITY_CONFIG } from "../../lib/mockData";
import { ArrowRight, AlertTriangle, ArrowUpDown, Search } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/overview")
      .then(res => res.json())
      .then(data => {
        if (data.latest_alerts) setAlerts(data.latest_alerts);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch alerts:", err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Alerts</h1>
          <p className="text-white/50 text-sm mt-1">Review active anomalies and risk signals require your attention.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search alerts..." 
            className="bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 w-full sm:w-64 transition-all"
          />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/5 text-white/50">
              <tr>
                <th className="px-6 py-4 font-medium flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors">Alert ID <ArrowUpDown className="w-3 h-3" /></th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium max-w-sm truncate whitespace-normal">Subject</th>
                <th className="px-6 py-4 font-medium text-right flex items-center justify-end gap-2 cursor-pointer hover:text-white/80 transition-colors">Impact (INR) <ArrowUpDown className="w-3 h-3" /></th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {alerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity];
                return (
                  <tr key={alert.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-white/70">{alert.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="font-medium text-xs tracking-wider uppercase" style={{ color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[300px] whitespace-normal">
                      <div className="font-medium text-white/90">{alert.title}</div>
                      <div className="text-white/40 text-xs mt-1 truncate">
                        {Array.isArray(alert.explanation) ? alert.explanation[0] : alert.explanation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-white/90">₹{((alert.predicted_impact_inr || alert.impact || 0) / 100000).toFixed(1)}L</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/alerts/${alert.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    Loading active alerts...
                  </td>
                </tr>
              )}
              {!loading && alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No active alerts found. System is stable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
