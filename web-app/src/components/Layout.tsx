import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  HardHat,
  FileText,
  AlertTriangle,
  Brain,
  MapPin,
  Leaf,
  LogOut,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/workers", icon: HardHat, label: "Workers" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/escalations", icon: AlertTriangle, label: "Escalations" },
  { href: "/dispatch", icon: MapPin, label: "Dispatch" },
  { href: "/ai/decisions", icon: Brain, label: "AI Decisions" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // The sidebar body is shared between the desktop rail and the mobile drawer.
  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <span className="text-sm font-bold leading-tight text-gray-900">
            Southern Roots
            <br />
            Turf
          </span>
        </div>
        {/* Close button — only visible inside the mobile drawer */}
        <button
          onClick={() => setMobileOpen(false)}
          className="text-gray-400 hover:text-gray-700 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-gray-200 p-4">
        <div>
          <div className="text-xs text-gray-400">AI-Powered Dispatch</div>
          <div className="mt-1 flex items-center gap-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">All agents running</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-gray-700">
              {user?.name ?? user?.email}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              {user?.role}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar (lg and up) */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        {sidebarBody}
      </aside>

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] border-r border-gray-200 bg-white shadow-xl">
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar with hamburger (hidden on lg) */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <span className="text-sm font-bold text-gray-900">
              Southern Roots Turf
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
