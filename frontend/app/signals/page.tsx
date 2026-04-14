"use client";

import { ComposedChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from "recharts";
import { TrendingDown, IndianRupee, Truck, PackageCheck, Server, CloudRain } from "lucide-react";

// 1. Demand & Sales Signals
const demandData = [
  { week: 'W1', growth: 4.2, volatility: 2.1, error: 5, orders: 120 },
  { week: 'W2', growth: 3.8, volatility: 2.5, error: 6, orders: 115 },
  { week: 'W3', growth: -1.2, volatility: 4.2, error: 12, orders: 95 }, // Sales dropping -> Demand risk
  { week: 'W4', growth: -2.5, volatility: 5.8, error: 18, orders: 82 },
  { week: 'W5', growth: -4.1, volatility: 6.5, error: 22, orders: 70 },
  { week: 'W6', growth: -3.8, volatility: 5.2, error: 15, orders: 75 },
];

// 2. Cost & Financial Signals
const costData = [
  { month: 'May', opCost: 100, margin: 25, logistics: 1.0 },
  { month: 'Jun', opCost: 102, margin: 24, logistics: 1.05 },
  { month: 'Jul', opCost: 105, margin: 22, logistics: 1.15 }, // Transport cost rising
  { month: 'Aug', opCost: 112, margin: 18, logistics: 1.25 }, // Margin risk
  { month: 'Sep', opCost: 115, margin: 15, logistics: 1.30 },
  { month: 'Oct', opCost: 118, margin: 14, logistics: 1.28 },
];

// 3. Vendor & Supply Chain Signals
const vendorData = [
  { vendor: 'Vendor_A', delayRate: 2.1, defectRate: 0.5, dependency: 15 },
  { vendor: 'Vendor_B', delayRate: 1.5, defectRate: 0.2, dependency: 10 },
  { vendor: 'Vendor_C', delayRate: 18.4, defectRate: 5.2, dependency: 65 }, // Single supplier dependency -> High Risk
  { vendor: 'Vendor_D', delayRate: 4.2, defectRate: 1.1, dependency: 10 },
];

// 4. Inventory & Operations Signals
const inventoryData = [
  { day: 'Day 1', turnover: 4.5, shortages: 1 },
  { day: 'Day 5', turnover: 4.2, shortages: 1 },
  { day: 'Day 10', turnover: 3.8, shortages: 2 },
  { day: 'Day 15', turnover: 2.5, shortages: 4 }, // Low inventory turnover -> Demand drop
  { day: 'Day 20', turnover: 1.8, shortages: 5 },
  { day: 'Day 25', turnover: 1.5, shortages: 7 },
];

// 5. Infrastructure / System Signals
const infraData = [
  { time: '00:00', utilization: 45, downtime: 0 },
  { time: '04:00', utilization: 52, downtime: 0 },
  { time: '08:00', utilization: 85, downtime: 1 },
  { time: '12:00', utilization: 98, downtime: 3 }, // Inefficiencies / overruns
  { time: '16:00', utilization: 95, downtime: 2 },
  { time: '20:00', utilization: 75, downtime: 0 },
];

// 6. External Environment
const weatherData = [
  { target: 'Mumbai', disruption: 0.2 },
  { target: 'Delhi', disruption: 0.1 },
  { target: 'Chennai', disruption: 0.8 }, // High weather disruption
  { target: 'Pune', disruption: 0.3 },
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

export default function SignalsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-500" /> Enterprise Signals Engine
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            Monitoring the 6 core pillars of business intelligence feeding the anomaly and risk classifiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Demand & Sales */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" /> Demand & Sales Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">Detecting business slowdown (Growth dropping + Volatility rising = Demand Risk).</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={demandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="right" dataKey="orders" name="Order Trend" fill="#3b82f6" fillOpacity={0.2} radius={[4,4,0,0]} />
                <Line yAxisId="left" type="monotone" dataKey="growth" name="Sales Growth %" stroke="#ef4444" strokeWidth={3} />
                <Line yAxisId="left" type="monotone" dataKey="volatility" name="Volatility" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cost & Financials */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-500" /> Cost & Financial Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">Detecting operational inefficiencies (Transport cost rising = Future margin risk).</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="margin" name="Profit Margin %" stroke="#10b981" fill="url(#marginGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="opCost" name="Op Cost Growth" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="logistics" name="Logistics Index" stroke="#8b5cf6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Vendor & Supply Chain */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" /> Vendor & Supply Chain Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">Single supplier dependency ratios coupled with delay/defect rates.</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="vendor" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="dependency" name="Dependency Ratio %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayRate" name="Delay Rate %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="defectRate" name="Defect Rate %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Inventory & Operations */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-500" /> Inventory & Ops Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">Low inventory turnover directly mapped to demand drops.</p>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis yAxisId="left" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis yAxisId="right" orientation="right" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                 <Tooltip content={<ChartTooltip />} />
                 <Line yAxisId="left" type="step" dataKey="turnover" name="Turnover Ratio" stroke="#14b8a6" strokeWidth={3} />
                 <Area yAxisId="right" type="monotone" dataKey="shortages" name="Shortage Freq" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Infrastructure */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-500" /> Infrastructure / System Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">High system utilization correlating perfectly to downtime vulnerabilities.</p>
          </div>
          <div className="h-64 mt-4 relative">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={infraData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis yAxisId="left" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis yAxisId="right" orientation="right" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                 <Tooltip content={<ChartTooltip />} />
                 <Area yAxisId="left" type="monotone" dataKey="utilization" name="Utilization %" stroke="#a855f7" fill="url(#utilGrad)" strokeWidth={2} />
                 <Bar yAxisId="right" dataKey="downtime" name="Downtime Freq" fill="#ef4444" radius={[2,2,0,0]} barSize={20} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* 6. External Environment */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-cyan-500" /> External Environment Signals
            </h2>
            <p className="text-xs text-white/50 mt-1">Isolated weather disruption indexing impacting logistics routes.</p>
          </div>
          <div className="h-64 mt-4 relative">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weatherData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                 <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                 <YAxis type="category" dataKey="target" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} width={60} />
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff08" />
                 <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                 <Bar dataKey="disruption" name="Disruption Index" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={32}>
                    {weatherData.map((e, idx) => (
                      <Cell key={`w-${idx}`} fill={e.disruption > 0.5 ? '#ef4444' : '#06b6d4'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
