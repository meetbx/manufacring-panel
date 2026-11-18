"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {/* Sidebar component with responsive states */}
      <Sidebar 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
        isCollapsed={isDesktopCollapsed}
      />

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isDesktopCollapsed ? "md:ml-0" : "md:ml-64"}`}>
        {/* Sticky Header with Hamburger Toggle for both Mobile and Desktop */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-8">
          <button
            onClick={() => {
              // On mobile, toggle drawer. On desktop, collapse/expand side panel.
              if (window.innerWidth < 768) {
                setIsMobileOpen(!isMobileOpen);
              } else {
                setIsDesktopCollapsed(!isDesktopCollapsed);
              }
            }}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider md:hidden">
            BharatTrade Portal
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}