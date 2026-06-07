import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, Zap, Leaf, BrainCircuit, Smartphone, HardHat, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const OTHER_APPS = [
  { label: "Main Site",       sub: "Greens Landscape",  href: "/greens-landscape", Icon: Leaf,         color: "bg-green-600"   },
  { label: "Client Portal",   sub: "Track Your Job",    href: "/client-portal",    Icon: Smartphone,   color: "bg-blue-600"    },
  { label: "Worker Portal",   sub: "Crew Field App",    href: "/worker-portal",    Icon: HardHat,      color: "bg-amber-600"   },
  { label: "Dispatch Portal", sub: "Operations Desk",   href: "/portal",           Icon: BarChart3,    color: "bg-slate-700"   },
];

const DEMO_LINKS: { label: string; path: string; badge?: string }[] = [
  { label: "Landing Page",          path: "/" },
  { label: "Quote — Address",       path: "/quote?demo=0",             badge: "Quote" },
  { label: "Quote — Satellite",     path: "/quote?demo=1&step=1",      badge: "Quote" },
  { label: "Quote — Services",      path: "/quote?demo=1&step=2",      badge: "Quote" },
  { label: "Quote — AI Output",     path: "/quote?demo=1&step=3",      badge: "Quote" },
  { label: "Quote — Your Info",     path: "/quote?demo=1&step=4",      badge: "Quote" },
  { label: "Quote — Confirmed",     path: "/quote?demo=1&step=5",      badge: "Quote" },
  { label: "Route Optimization",    path: "/route" },
  { label: "Maintenance Dashboard", path: "/maintenance" },
  { label: "Neighborhood Leads",    path: "/leads" },
  { label: "Owner Dashboard",       path: "/dashboard" },
];

const SCENARIO_LINKS = [
  { label: "Large Bundle — Atlanta",    path: "/quote?demo=1&scenario=0" },
  { label: "Starter Mow — Savannah",   path: "/quote?demo=1&scenario=1" },
  { label: "Full Estate — Augusta",    path: "/quote?demo=1&scenario=2" },
  { label: "Pressure + Mow — Roswell", path: "/quote?demo=1&scenario=3" },
];

export function DemoBar() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const go = (path: string) => { setOpen(false); setLocation(path); };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mb-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Quote Scenarios</p>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_LINKS.map((s) => (
                  <button key={s.path} onClick={() => go(s.path)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">All Pages</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DEMO_LINKS.map((link) => (
                  <button key={link.path} onClick={() => go(link.path)}
                    className={cn(
                      "flex flex-col text-left px-3 py-2 rounded-xl border transition-all",
                      link.badge === "Quote"
                        ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                        : "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700"
                    )}>
                    <span className="text-xs font-semibold text-zinc-100 leading-snug">{link.label}</span>
                    {link.badge && <span className="text-[10px] text-primary/70 mt-0.5">{link.badge} wizard</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pt-3 pb-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Other Apps in this Ecosystem</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OTHER_APPS.map((app) => (
                  <a key={app.href} href={app.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 transition-all">
                    <div className={`w-6 h-6 rounded-lg ${app.color} flex items-center justify-center flex-shrink-0`}>
                      <app.Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-100 leading-snug truncate">{app.label}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{app.sub}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setOpen((o) => !o)} data-testid="btn-demo-bar-toggle"
        className="w-full flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 hover:bg-zinc-800 backdrop-blur transition-all">
        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-left">Demo Mode</span>
        <span className="text-zinc-500 text-xs font-normal hidden sm:inline">Navigate features &amp; scenarios</span>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" /> : <ChevronUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />}
      </button>
    </div>
  );
}
