import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/workers", icon: HardHat, label: "Workers" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/escalations", icon: AlertTriangle, label: "Escalations" },
  { href: "/dispatch", icon: MapPin, label: "Dispatch" },
  { href: "/ai/decisions", icon: Brain, label: "AI Decisions" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="font-bold text-gray-900 text-sm leading-tight">
              Southern Roots
              <br />
              Turf
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">AI-Powered Dispatch</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-600">All agents running</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
