"use client";

import { useState } from "react";
import { Search, Shield, AlertTriangle, MessageSquare, CreditCard, Zap, Check, X } from "lucide-react";

const API = "http://localhost:8000";

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState<"url" | "text" | "transaction">("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // URL state
  const [url, setUrl] = useState("");
  // Text state
  const [text, setText] = useState("");
  // Transaction state
  const [txn, setTxn] = useState({
    amount: 500,
    hour_of_day: 14,
    sender_account_age_days: 365,
    receiver_account_age_days: 30,
    is_new_receiver: false,
    same_device_as_usual: true,
    velocity_1h: 0,
    velocity_24h: 1,
    cross_border: false,
  });

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    try {
      let endpoint = "";
      let body: any = {};

      if (activeTab === "url") {
        endpoint = "/api/scan/url";
        body = { url };
      } else if (activeTab === "text") {
        endpoint = "/api/scan/text";
        body = { text };
      } else {
        endpoint = "/api/scan/transaction";
        body = txn;
      }

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: "Connection failed" });
    }
    setLoading(false);
  };

  const tabs = [
    { id: "url" as const, label: "URL Scanner", icon: Shield, desc: "Phishing URL detection" },
    { id: "text" as const, label: "Text Analyzer", icon: MessageSquare, desc: "Scam text classification" },
    { id: "transaction" as const, label: "Transaction Check", icon: CreditCard, desc: "Fraud anomaly detection" },
  ];

  return (
    <div className="space-y-6 max-w-[900px] mx-auto pb-12">
      <div className="border-b border-white/[0.06] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-3">
          <Search className="w-6 h-6 text-cyan-400" />
          Live Scanner
        </h1>
        <p className="text-white/35 text-sm mt-1.5">Run real-time ML inference on URLs, text messages, and transaction patterns.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              activeTab === tab.id 
                ? "border-cyan-500/20 bg-cyan-500/[0.03]" 
                : "border-white/[0.06] bg-[#0A0A0D] hover:border-white/10"
            }`}
          >
            <tab.icon className={`w-5 h-5 mb-2 ${activeTab === tab.id ? "text-cyan-400" : "text-white/30"}`} />
            <div className={`text-[13px] font-semibold ${activeTab === tab.id ? "text-white" : "text-white/60"}`}>{tab.label}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
        {activeTab === "url" && (
          <div>
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">URL to Scan</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://monzo-support-verify.top/login"
              className="w-full bg-[#050507] border border-white/10 rounded-lg px-4 py-3 text-[13px] font-mono text-white placeholder:text-white/15 focus:outline-none focus:border-cyan-500/30"
            />
          </div>
        )}

        {activeTab === "text" && (
          <div>
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Message / Text Content</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="URGENT: Your PayPal account has been limited. Verify now..."
              rows={4}
              className="w-full bg-[#050507] border border-white/10 rounded-lg px-4 py-3 text-[13px] font-mono text-white placeholder:text-white/15 focus:outline-none focus:border-cyan-500/30 resize-none"
            />
          </div>
        )}

        {activeTab === "transaction" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "amount", label: "Amount (£)", type: "number" },
              { key: "hour_of_day", label: "Hour of Day (0-23)", type: "number" },
              { key: "sender_account_age_days", label: "Sender Account Age (days)", type: "number" },
              { key: "receiver_account_age_days", label: "Receiver Account Age (days)", type: "number" },
              { key: "velocity_1h", label: "Transactions in Last Hour", type: "number" },
              { key: "velocity_24h", label: "Transactions in 24h", type: "number" },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-1.5">{field.label}</label>
                <input
                  type="number"
                  value={(txn as any)[field.key]}
                  onChange={e => setTxn({ ...txn, [field.key]: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg px-3 py-2 text-[13px] font-mono text-white focus:outline-none focus:border-cyan-500/30"
                />
              </div>
            ))}
            {[
              { key: "is_new_receiver", label: "New Receiver" },
              { key: "same_device_as_usual", label: "Same Device" },
              { key: "cross_border", label: "Cross-Border" },
            ].map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <button
                  onClick={() => setTxn({ ...txn, [field.key]: !(txn as any)[field.key] })}
                  className={`w-10 h-5 rounded-full transition-all ${(txn as any)[field.key] ? "bg-cyan-500" : "bg-white/10"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${(txn as any)[field.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <label className="text-[11px] text-white/50">{field.label}</label>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={loading}
          className="mt-5 w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-[14px] hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && !result.error && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0A0D] anim-fade-up">
          <div className="flex items-center gap-3 mb-4">
            {(result.is_phishing || result.is_scam || result.is_anomaly) ? (
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div>
              <div className={`text-xl font-bold font-mono ${(result.is_phishing || result.is_scam || result.is_anomaly) ? "text-red-400" : "text-emerald-400"}`}>
                {result.verdict}
              </div>
              <div className="text-[10px] text-white/30 font-mono">
                Confidence: {((result.confidence || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.entries(result)
              .filter(([k]) => !["timestamp", "verdict", "error"].includes(k) && typeof result[k] !== "object")
              .map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[9px] font-mono text-white/25 uppercase">{key.replace(/_/g, " ")}</div>
                  <div className="text-[13px] font-mono text-white/70 mt-0.5">{String(value)}</div>
                </div>
              ))}
          </div>

          {result.top_signals && (
            <div className="mt-4">
              <div className="text-[9px] font-mono text-white/25 uppercase mb-2">Model Feature Importance</div>
              <div className="space-y-1.5">
                {result.top_signals.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/40 w-32 truncate">{s.feature}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.min(s.importance * 100, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-white/30 w-12 text-right">{s.importance?.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
