"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertCircle, UploadCloud, Settings, Database, Activity } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Alerts", href: "/alerts", icon: AlertCircle, badge: "2" },
    { name: "Data Upload", href: "/upload", icon: UploadCloud },
    { name: "Signals", href: "/signals", icon: Activity },
    { name: "Model Ops", href: "/model-ops", icon: Database },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 w-64 h-screen border-r border-white/5 bg-[#0A0A0A] flex flex-col transition-all">
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-orange-600 to-yellow-500 shadow-[0_0_12px_rgba(234,88,12,0.5)] flex items-center justify-center">
            <span className="text-[10px] font-black text-black">EW</span>
          </div>
          <span className="font-display font-bold tracking-tight text-white/90">E-WASP</span>
        </div>
      </div>
      
      <div className="px-4 py-6 flex-1 overflow-y-auto w-full">
        <div className="font-mono text-[10px] uppercase text-white/40 mb-3 px-2 tracking-widest">Platform</div>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href) && link.href !== "#";
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-orange-400" : "text-white/40 group-hover:text-white/70")} />
                  <span className="text-sm font-medium">{link.name}</span>
                </div>
                {link.badge && (
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/80">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white/90">Admin User</span>
            <span className="text-xs text-white/40 font-mono">Operations</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
