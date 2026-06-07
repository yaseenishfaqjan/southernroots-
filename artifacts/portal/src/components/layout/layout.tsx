import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  PlusCircle,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { AppSwitcher } from "@/components/AppSwitcher";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { brand } from "@workspace/brand";

const navigation = [
  { name: "Dashboard",      href: "/",    icon: LayoutDashboard, desc: "Overview & KPIs" },
  { name: "Dispatch Board", href: "/jobs", icon: Briefcase,       desc: "Jobs & assignments" },
  { name: "Subcontractors", href: "/subs", icon: Users,           desc: "Crew management" },
];

function NavLinks({ location, onNav }: { location: string; onNav?: () => void }) {
  return (
    <nav className="space-y-1 px-3">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNav}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
            <div className="flex-1 min-w-0">
              <span className="block truncate">{item.name}</span>
              <span className={`block text-xs font-normal truncate ${isActive ? "text-white/70" : "text-gray-400"}`}>{item.desc}</span>
            </div>
            {isActive && <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ location, onNav }: { location: string; onNav?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="flex flex-col items-center justify-center px-4 py-5 border-b border-gray-100">
        <img src="/logo.png" alt={brand.logoAlt} className="h-20 w-auto object-contain" />
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispatch Portal</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks location={location} onNav={onNav} />
      </div>

      {/* Quick action */}
      <div className="p-4 border-t border-gray-100">
        <Link href="/jobs/new" onClick={onNav}>
          <Button className="w-full gap-2 h-10 font-semibold">
            <PlusCircle className="w-4 h-4" />
            New Lead
          </Button>
        </Link>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-widest">{brand.name}</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSwitcher />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden shadow-xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent location={location} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 w-64">
        <SidebarContent location={location} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt={brand.logoAlt} className="h-10 w-auto object-contain" />
          <Link href="/jobs/new">
            <Button size="sm" className="h-8 px-3 text-xs gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              New Lead
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
