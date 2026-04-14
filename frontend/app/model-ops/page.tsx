"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from "recharts";
import { Database, Activity, GitCommit, HardDrive, BrainCircuit } from "lucide-react";

const performanceData = [
  { metric: 'Accuracy', RandomForest: 92, Prophet: 88, Baseline: 65 },
  { metric: 'Precision', RandomForest: 89, Prophet: 85, Baseline: 60 },
  { metric: 'Recall', RandomForest: 94, Prophet: 82, Baseline: 70 },
  { metric: 'F1 Score', RandomForest: 91, Prophet: 84, Baseline: 64 },
  { metric: 'Latency', RandomForest: 95, Prophet: 75, Baseline: 99 }, 
];

const driftData = [
  { day: 'Day 1', p_value: 0.85, limit: 0.05 },
  { day: 'Day 5', p_value: 0.72, limit: 0.05 },
  { day: 'Day 10', p_value: 0.61, limit: 0.05 },
  { day: 'Day 15', p_value: 0.45, limit: 0.05 },
  { day: 'Day 20', p_value: 0.22, limit: 0.05 },
  { day: 'Day 25', p_value: 0.11, limit: 0.05 },
  { day: 'Day 30', p_value: 0.04, limit: 0.05 }, // Drift detected
];

const rocData = [
  { fpr: 0.00, tpr: 0.00 },
  { fpr: 0.05, tpr: 0.60 },
  { fpr: 0.10, tpr: 0.82 },
  { fpr: 0.15, tpr: 0.91 },
  { fpr: 0.20, tpr: 0.94 },
  { fpr: 0.40, tpr: 0.97 },
  { fpr: 0.60, tpr: 0.99 },
  { fpr: 1.00, tpr: 1.00 },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/10 p-3 rounded-lg shadow-xl text-xs font-mono">
      <div className="text-white/50 mb-2 border-b border-white/10 pb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill || "#fff" }} />
          <span className="text-white/80">{p.name || p.dataKey}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ModelOpsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Model Operations</h1>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            Continuous validation matrices for E-WASP's ensemble models. Monitor data drift, diagnostic curves, and performance benchmarking.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          SYSTEM HEALTHY
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GRAPH 1: RADAR METRICS */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg flex flex-col">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" /> Ensemble Evaluation
            </h2>
            <p className="text-xs text-white/50 mt-1">Macro-averaged cross-validation scores.</p>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 10 }} />
                <Radar name="Random Forest" dataKey="RandomForest" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                <Radar name="Prophet" dataKey="Prophet" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: DATA DRIFT */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg md:col-span-2">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" /> Kolmogorov-Smirnov Data Drift
              </h2>
              <p className="text-xs text-white/50 mt-1">Monitoring distribution shift between training and live inference data.</p>
            </div>
            {driftData[driftData.length - 1].p_value < 0.05 && (
              <span className="text-[10px] font-mono font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                DRIFT DETECTED (p &lt; 0.05)
              </span>
            )}
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driftData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0.05} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Threshold (p=0.05)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="p_value" name="P-Value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#0A0A0A', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 3: ROC CURVE */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg md:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-blue-500" /> Receiver Operating Characteristic (ROC)
            </h2>
            <p className="text-xs text-white/50 mt-1">Diagnostic ability of the binary classifier system (AUC: 0.94).</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rocData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rocGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="fpr" name="False Positive Rate" type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <YAxis dataKey="tpr" name="True Positive Rate" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="tpr" name="Classifier" stroke="#3b82f6" fill="url(#rocGrad)" strokeWidth={3} />
                <Line dataKey="fpr" data={[...rocData].map(d => ({ fpr: d.fpr, tpr: d.fpr }))} name="Random Guess" stroke="#525252" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HARDWARE DIAGNOSTICS */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-teal-500" /> Inference Pipeline
            </h2>
            <p className="text-xs text-white/50 mt-1">Hardware telemetry limits.</p>
          </div>
          <div className="space-y-6 mt-6">
            <div>
              <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                <span>GPU Memory (VRAM)</span>
                <span>14.2 / 24 GB</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '59%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                <span>Avg Inference Latency</span>
                <span>42 ms</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                <span>Throughput</span>
                <span>1,420 req/s</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
