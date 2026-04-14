"use client";

import { Settings, Sliders, ShieldCheck, Mail, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.85);
  const [vendorRiskThreshold, setVendorRiskThreshold] = useState(0.55);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-white/60" /> Configuration
          </h1>
          <p className="text-white/50 text-sm mt-2">
            Tune E-WASP's predictive thresholds, APIs, and administrative policies.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* ML PARAMETERS */}
        <section className="bg-[#0A0A0A] p-6 border border-white/10 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <Sliders className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-white font-display">AI/ML Hyperparameters</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/80">Isolation Forest Contamination Threshold</label>
                <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-orange-400">{anomalyThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.0" 
                step="0.01" 
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                className="w-full appearance-none h-1 bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">Lowering this will increase the sensitivity of the anomaly detector (more alerts).</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/80">Vendor Critical-Risk Cutoff</label>
                <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-red-500">{vendorRiskThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.01" 
                value={vendorRiskThreshold}
                onChange={(e) => setVendorRiskThreshold(parseFloat(e.target.value))}
                className="w-full appearance-none h-1 bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">If vendor reliability drops below this value, a CRITICAL severity alert will fire immediately.</p>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/80">Continuous Retraining</span>
                <span className="text-xs text-white/40">Automatically retrain models at 00:00 GMT weekly.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* API INTEGRATIONS */}
        <section className="bg-[#0A0A0A] p-6 border border-white/10 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-white font-display">External API Gateways</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-white/50 block mb-1">OpenWeatherMap API Key</label>
              <input type="password" defaultValue={"••••••••••••••••••••••••"} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-orange-500 transition-colors font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-white/50 block mb-1">NewsAPI Access Token</label>
              <input type="password" defaultValue={"••••••••••••••••••••••••"} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-orange-500 transition-colors font-mono" />
            </div>
          </div>
        </section>

      </div>
      
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.1)]"
        >
          {isSaved ? "Saved Successfully!" : <><Save className="w-4 h-4" /> Save Configuration</>}
        </button>
      </div>
      
    </div>
  );
}
