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
  MessageSquare // <-- 1. Import MessageSquare icon
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Add Product", href: "/dashboard/products/new", icon: PlusSquare },
    { name: "Messages", href: "/manufacturer/messages", icon: MessageSquare }, // <-- 2. Add Messages link here
    { name: "Company Profile", href: "/dashboard/company-profile", icon: Building2 },
    { name: "Certifications", href: "/dashboard/certifications", icon: Award },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Store className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="font-bold text-white text-lg tracking-wide">BharatTrade</h1>
            <p className="text-xs text-slate-400 font-medium">Manufacturer Panel</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
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
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}