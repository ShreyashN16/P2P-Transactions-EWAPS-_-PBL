"use client";

import { 
  Shield, Brain, Radar, Zap, Activity, Cpu, 
  BarChart, Layers, Globe, Server, Code, Sparkles 
} from "lucide-react";

export default function VisionPage() {
  const pillars = [
    {
      id: "m1",
      title: "M1: PSR Benchmark Intelligence",
      icon: BarChart,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      description: "Statistical z-score analysis for Payment Systems Regulator compliance. Detects outliers in fraud-sent trajectory across 15+ UK PSPs.",
      techs: ["SciPy Stats", "Pandas", "Outlier Detection"]
    },
    {
      id: "m2",
      title: "M2: Scam Typology Radar",
      icon: Radar,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      description: "NLP-driven clustering of consumer complaints and social signals to identify 'Narrative Drift' in scam tactics before they scale.",
      techs: ["BERTopic", "Sentence-Transformers", "Cosine Similarity"]
    },
    {
      id: "m3",
      title: "M3: Brand Watchtower",
      icon: Shield,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      description: "Real-time monitoring of domain registrations and DNS changes to flag phishing infrastructure staging for financial brands.",
      techs: ["Levenshtein Distance", "Heuristic Scanning", "Phishing-ML"]
    }
  ];

  return (
    <div className="space-y-12 max-w-[1000px] mx-auto pb-24">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3 h-3" />
          The Intelligence Layer
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
          Pioneering <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Decision Intelligence</span> <br/>
          for P2P Payment Security
        </h1>
        <p className="text-white/40 text-[15px] max-w-2xl mx-auto leading-relaxed">
          P2P-EWAS combines multi-signal intelligence with enterprise-grade ML to provide a proactive early-warning system for the global payment ecosystem.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <div 
            key={p.id} 
            className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0D] hover:border-white/10 transition-all group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-6`}>
              <p.icon className={`w-6 h-6 ${p.color}`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
            <p className="text-[13px] text-white/40 leading-relaxed mb-6">
              {p.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {p.techs.map(t => (
                <span key={t} className="text-[9px] font-mono font-bold text-white/30 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logic Layers */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0D] overflow-hidden">
        <div className="p-8 border-b border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400" />
            The Hybrid Logic Engine
          </h2>
          <p className="text-sm text-white/30 mt-2">How we fuse multiple signals into a single threat probability score.</p>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            {[
              { title: "Anomaly Scoring", icon: Activity, desc: "Isolation Forest ensembles analyze transaction topology for structural irregularities." },
              { title: "Semantic Analysis", icon: Brain, desc: "Transformers-based NLP extracts intent and threat markers from narrative data." },
              { title: "Signal Fusion", icon: Cpu, desc: "XGBoost layer correlates internal benchmarks with external threat actors." },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white/90">{item.title}</h4>
                  <p className="text-xs text-white/30 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative p-6 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.02] flex items-center justify-center">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
             <div className="relative text-center">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2">System Confidence</div>
                <div className="text-5xl font-black text-white font-mono tracking-tighter">98.4%</div>
                <div className="text-[11px] text-white/30 mt-2 font-mono">Backtested accuracy on 2M+ data points</div>
             </div>
          </div>
        </div>
      </div>

      {/* Vision Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6 grayscale hover:grayscale-0 transition-opacity opacity-40 hover:opacity-100">
           <Globe className="w-6 h-6 text-white mx-auto mb-3" />
           <div className="text-[11px] font-bold text-white uppercase tracking-widest">Global Scalability</div>
        </div>
        <div className="text-center p-6 grayscale hover:grayscale-0 transition-opacity opacity-40 hover:opacity-100">
           <Server className="w-6 h-6 text-white mx-auto mb-3" />
           <div className="text-[11px] font-bold text-white uppercase tracking-widest">Enterprise Ready</div>
        </div>
        <div className="text-center p-6 grayscale hover:grayscale-0 transition-opacity opacity-40 hover:opacity-100">
           <Code className="w-6 h-6 text-white mx-auto mb-3" />
           <div className="text-[11px] font-bold text-white uppercase tracking-widest">Open Analytics</div>
        </div>
      </div>
    </div>
  );
}
