import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Leaf, BrainCircuit, Smartphone, HardHat, BarChart3, X } from "lucide-react";

const APPS = [
  { id: "greens",    label: "Main Site",       sub: "Greens Landscape",  href: "/greens-landscape", Icon: Leaf,          color: "bg-green-600",   ring: "ring-green-400"  },
  { id: "quote",     label: "AI Quote System", sub: "Instant Estimates", href: "/lawn-quotes",      Icon: BrainCircuit,  color: "bg-emerald-600", ring: "ring-emerald-400" },
  { id: "client",   label: "Client Portal",   sub: "Track Your Job",    href: "/client-portal",    Icon: Smartphone,    color: "bg-blue-600",    ring: "ring-blue-400"   },
  { id: "worker",   label: "Worker Portal",   sub: "Crew Field App",    href: "/worker-portal",    Icon: HardHat,       color: "bg-amber-600",   ring: "ring-amber-400"  },
  { id: "dispatch", label: "Dispatch Portal", sub: "Operations Desk",   href: "/portal",           Icon: BarChart3,     color: "bg-slate-700",   ring: "ring-slate-400"  },
];

const CURRENT = "worker";

export function AppSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden w-64"
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Switch App</p>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2">
              {APPS.map((app) => {
                const isCurrent = app.id === CURRENT;
                return (
                  <a key={app.id} href={app.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isCurrent ? "bg-zinc-700/70" : "hover:bg-zinc-800"}`}>
                    <div className={`w-9 h-9 rounded-xl ${app.color} flex items-center justify-center flex-shrink-0 ${isCurrent ? `ring-2 ${app.ring} ring-offset-1 ring-offset-zinc-900` : ""}`}>
                      <app.Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? "text-white" : "text-zinc-200"}`}>{app.label}</p>
                      <p className="text-xs text-zinc-500 truncate">{app.sub}</p>
                    </div>
                    {isCurrent && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex-shrink-0">Here</span>}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
        title="Switch app">
        {open ? <X className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
      </button>
    </div>
  );
}
