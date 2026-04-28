"use client";

import { Settings, Shield, Brain, Database, Clock, Server } from "lucide-react";
import { useState, useEffect } from "react";

const API = "http://localhost:8000";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/health`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/analytics/model-performance`).then(r => r.json()).catch(() => null),
    ]).then(([h, m]) => {
      setHealth(h);
      setModels(m?.models || []);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-12">
      <div className="border-b border-white/[0.06] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
          <Settings className="w-6 h-6 text-white/50" />
          System Settings
        </h1>
        <p className="text-white/35 text-sm mt-1.5">ML model status, system health, and platform configuration.</p>
      </div>

      {/* System Health */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-emerald-400" />
          System Health
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-lg font-bold text-emerald-400 font-mono">{health?.status || "—"}</div>
            <div className="text-[9px] text-white/30 mt-0.5 font-mono uppercase">API Status</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-lg font-bold text-cyan-400 font-mono">{health?.ml_engine?.operational || 0}/{health?.ml_engine?.total_models || 4}</div>
            <div className="text-[9px] text-white/30 mt-0.5 font-mono uppercase">Models Active</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-lg font-bold text-white font-mono">{health?.data_pipeline || "—"}</div>
            <div className="text-[9px] text-white/30 mt-0.5 font-mono uppercase">Data Pipeline</div>
          </div>
        </div>
      </div>

      {/* ML Models */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-cyan-400" />
          ML Model Performance
        </h3>
        <div className="space-y-3">
          {models.map((model: any, i: number) => {
            const metrics = model.metrics || model.metrics_vs_fraud_labels || {};
            return (
              <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-semibold text-white/80">{model.task?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                    <div className="text-[10px] text-white/30 font-mono mt-0.5">{model.model} • {model.train_samples?.toLocaleString() || "—"} training samples</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(metrics).map(([key, val]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className="text-[14px] font-bold font-mono text-cyan-400">{(val * 100).toFixed(1)}%</div>
                      <div className="text-[8px] text-white/25 font-mono uppercase mt-0.5">{key.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Info */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-orange-400" />
          Platform Configuration
        </h3>
        <div className="space-y-2">
          {[
            { label: "Version", value: "2.0.0" },
            { label: "Backend", value: "FastAPI + Uvicorn" },
            { label: "ML Framework", value: "scikit-learn + LightGBM" },
            { label: "Frontend", value: "Next.js 14 + Tailwind CSS" },
            { label: "Data Sources", value: "CFPB, URLhaus, Tranco, Synthetic PSR" },
            { label: "Models", value: "Phishing LightGBM, Text TF-IDF+LightGBM, Fraud LightGBM, Anomaly IsolationForest" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
              <span className="text-[11px] text-white/40">{item.label}</span>
              <span className="text-[11px] text-white/70 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
