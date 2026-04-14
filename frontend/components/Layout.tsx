"use client";

import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono flex-1 text-right text-[#FFB400] text-xs">{time} IST</span>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E6E1] font-sans selection:bg-orange-500/30">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen transition-all">
        <header className="h-16 border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-mono font-medium text-green-500 tracking-wider">SYSTEMS OPERATIONAL</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LiveClock />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
