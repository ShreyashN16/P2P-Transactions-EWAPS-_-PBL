"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Scatter, BarChart, Bar, Cell, ScatterChart, ZAxis } from "recharts";
import { AlertCircle, IndianRupee, Store, ShieldAlert, Brain, Zap, Network, Activity } from "lucide-react";

// Mock Data for the 4 ML Models
const prophetData = [
  { date: 'Oct 01', actual: 4000, forecast: 4100, lower: 3800, upper: 4400 },
  { date: 'Oct 08', actual: 3000, forecast: 3200, lower: 2900, upper: 3500 },
  { date: 'Oct 15', actual: 2000, forecast: 2400, lower: 2100, upper: 2700 },
  { date: 'Oct 22', actual: 2780, forecast: 2900, lower: 2600, upper: 3200 },
  { date: 'Oct 29', actual: null, forecast: 2100, lower: 1800, upper: 2400 },
  { date: 'Nov 05', actual: null, forecast: 2500, lower: 2200, upper: 2800 },
  { date: 'Nov 12', actual: null, forecast: 3600, lower: 3200, upper: 4000 },
];

const isolationForestData = [
  { index: 1, value: 45, isAnomaly: false },
  { index: 2, value: 48, isAnomaly: false },
  { index: 3, value: 50, isAnomaly: false },
  { index: 4, value: 120, isAnomaly: true, anomalyValue: 120 }, // Anomaly
  { index: 5, value: 47, isAnomaly: false },
  { index: 6, value: 42, isAnomaly: false },
  { index: 7, value: 15, isAnomaly: true, anomalyValue: 15 }, // Anomaly
  { index: 8, value: 52, isAnomaly: false },
  { index: 9, value: 49, isAnomaly: false },
];

const shapData = [
  { feature: "Sales Growth Rate", importance: 0.28, direction: "adverse" },
  { feature: "System Utilization", importance: 0.18, direction: "adverse" },
  { feature: "Vendor Delay Rate", importance: 0.15, direction: "adverse" },
  { feature: "Profit Margin Trend", importance: 0.14, direction: "favorable" },
  { feature: "Op Cost Growth", importance: 0.10, direction: "adverse" },
  { feature: "Inventory Turnover", importance: 0.08, direction: "favorable" },
  { feature: "Weather Disruption", importance: 0.05, direction: "adverse" },
  { feature: "Supplier Defect Rate", importance: 0.02, direction: "adverse" },
];

const clusteringData = [
  { vendor: "Vendor_C", reliability: 52, defectRate: 18.3, cluster: "critical" },
  { vendor: "Vendor_H", reliability: 48, defectRate: 21.1, cluster: "critical" },
  { vendor: "Vendor_M", reliability: 61, defectRate: 9.4, cluster: "monitor" },
  { vendor: "Vendor_A", reliability: 87, defectRate: 2.1, cluster: "safe" },
  { vendor: "Vendor_B", reliability: 95, defectRate: 0.8, cluster: "safe" },
  { vendor: "Vendor_K", reliability: 83, defectRate: 3.2, cluster: "safe" },
  { vendor: "Vendor_E", reliability: 69, defectRate: 6.8, cluster: "monitor" },
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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/overview")
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Failed to fetch dashboard:", err));
  }, []);

  const stats = [
    { label: "Active Pipeline Models", value: "4 ML", icon: Brain, change: "Live", color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Detected Anomalies", value: "2", icon: AlertCircle, change: "IsolationForest", color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Critical Variables", value: "3", icon: Network, change: "SHAP Explainers", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Forecast Trajectory", value: "Down", icon: Activity, change: "Prophet", color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">E-WASP ML Intelligence</h1>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            Real-time algorithmic analysis displaying outputs from Isolation Forest (Anomalies), Prophet (Time Series), Random Forest (Logic Fusion), and K-Means (Clustering).
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          MODELS SYNCED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-5 rounded-xl border border-white/5 bg-[#0A0A0A] shadow-sm flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded bg-white/5 text-white/60 uppercase tracking-widest border border-white/5`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-5 relative z-10">
                <span className="text-2xl font-bold tracking-tight text-white">{stat.value}</span>
                <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider font-mono">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 1: PROPHET FORECAST */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-orange-500" /> Prophet Forecasting Model
              </h2>
              <p className="text-xs text-white/50 mt-1.5">Projecting demand variance over a 4-week future horizon.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60"><div className="w-2 h-0.5 bg-orange-500" /> ACTUAL</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60"><div className="w-2 h-0.5 border-t border-dashed border-orange-300" /> FORECAST</div>
            </div>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prophetData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="forecast" stroke="none" fill="url(#forecastGrad)" />
                <Line type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#0A0A0A', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="forecast" stroke="#fdba74" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: ISOLATION FOREST ANOMALIES */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" /> Isolation Forest Anomaly Detection
              </h2>
              <p className="text-xs text-white/50 mt-1.5">Unsupervised outlier detection across time-series metrics.</p>
            </div>
             <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60"><div className="w-2 h-2 rounded-full bg-red-500" /> OUTLIER</div>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={isolationForestData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="index" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <Line type="step" dataKey="value" stroke="#525252" strokeWidth={2} dot={false} />
                <Scatter dataKey="anomalyValue" fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 3: RANDOM FOREST SHAP */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Network className="w-5 h-5 text-yellow-500" /> Feature Importance (SHAP)
            </h2>
            <p className="text-xs text-white/50 mt-1.5">RandomForestClassifier logic mapped to distinct signal impact weights.</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis type="category" dataKey="feature" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} width={120} />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={24}>
                  {shapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.direction === "adverse" ? "#f97316" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 4: CLUSTERING */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" /> Vendor Risk Clustering
              </h2>
              <p className="text-xs text-white/50 mt-1.5">K-Means segmentation grouping vendors by Supply vs Defect vulnerability.</p>
            </div>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis type="number" dataKey="reliability" name="Reliability Score" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[40, 100]} />
                <YAxis type="number" dataKey="defectRate" name="Defect Rate %" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 25]} />
                <ZAxis type="category" dataKey="vendor" name="Vendor" />
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#525252' }} />
                
                <Scatter name="Critical" data={clusteringData.filter(d => d.cluster === "critical")} fill="#ef4444" />
                <Scatter name="Monitor" data={clusteringData.filter(d => d.cluster === "monitor")} fill="#f59e0b" />
                <Scatter name="Safe" data={clusteringData.filter(d => d.cluster === "safe")} fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
            
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] font-mono text-white/50">Critical</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] font-mono text-white/50">Monitor</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] font-mono text-white/50">Safe</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Ensure the icon exists
function BarChart2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}
