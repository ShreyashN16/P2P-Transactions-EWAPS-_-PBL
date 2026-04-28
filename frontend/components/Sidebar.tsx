"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, AlertTriangle, Radar, Globe, BarChart3, 
  Crosshair, Settings, Activity, Zap, Search
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();

  const mainLinks = [
    { name: "Command Center", href: "/dashboard", icon: Shield },
    { name: "Vision & Engineering", href: "/vision", icon: Zap },
    { name: "Threat Feed", href: "/threats", icon: AlertTriangle, badge: "8" },
    { name: "Typology Radar", href: "/intelligence", icon: Radar },
    { name: "Phishing Monitor", href: "/phishing", icon: Crosshair },
    { name: "PSR Benchmark", href: "/benchmark", icon: BarChart3 },
  ];

  const toolLinks = [
    { name: "Live Scanner", href: "/scanner", icon: Search },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 w-[260px] h-screen border-r border-white/[0.06] bg-[#09090B] flex flex-col">
      {/* Logo */}
      <div className="flex h-[60px] items-center px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#09090B] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[15px] tracking-tight text-white/95">P2P EWAS</span>
            <span className="text-[9px] font-mono text-cyan-400/70 tracking-[0.2em] uppercase">Early Warning System</span>
          </div>
        </div>
      </div>

      {/* Threat Level Indicator */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-mono text-orange-400/80 uppercase tracking-widest">Threat Level</span>
          <span className="text-[9px] font-mono text-orange-300 font-bold animate-pulse">ELEVATED</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="font-mono text-[9px] uppercase text-white/25 mb-2 px-2 tracking-[0.15em]">Intelligence</div>
        <nav className="space-y-0.5">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-[15px] h-[15px]", isActive ? "text-cyan-400" : "text-white/30 group-hover:text-white/50")} />
                  <span className="text-[13px] font-medium">{link.name}</span>
                </div>
                {link.badge && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-md bg-red-500/15 text-red-400 text-[10px] font-mono font-bold border border-red-500/25 px-1">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="font-mono text-[9px] uppercase text-white/25 mb-2 px-2 mt-6 tracking-[0.15em]">Tools</div>
        <nav className="space-y-0.5">
          {toolLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("w-[15px] h-[15px]", isActive ? "text-cyan-400" : "text-white/30")} />
                <span className="text-[13px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-[10px] font-mono text-emerald-400/80">4 Models Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 border border-cyan-500/20">
            OP
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-white/80">Operations</span>
            <span className="text-[10px] text-white/30 font-mono">v2.0 • live</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
