"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Package, 
  PlusSquare, 
  Building2, 
  Award, 
  LogOut,
  Store,
  MessageSquare,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export default function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Add Product", href: "/dashboard/products/new", icon: PlusSquare },
    { name: "Messages", href: "/manufacturer/messages", icon: MessageSquare },
    { name: "Company Profile", href: "/dashboard/company-profile", icon: Building2 },
    { name: "Certifications", href: "/dashboard/certifications", icon: Award },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:-ml-64" : "md:w-64"} w-64`}
      >
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <Store className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h1 className="font-bold text-white text-lg tracking-wide whitespace-nowrap">BharatTrade</h1>
                <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Manufacturer Panel</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={onClose} 
              className="p-1 text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose} // Auto-close drawer on mobile navigation
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}