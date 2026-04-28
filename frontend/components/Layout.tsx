"use client";

import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050507]">
      <Sidebar />
      <main className="ml-[260px] min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
