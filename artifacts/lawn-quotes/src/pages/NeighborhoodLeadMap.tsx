import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Zap, Home, Ruler, TrendingUp, Users, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NEIGHBORHOOD_LEADS } from "@/lib/mock-data";

type FilterKey = "large-yard" | "dirty-driveway" | "high-income" | "existing-cx-nearby";

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: "large-yard",         label: "Large Yards",          color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "dirty-driveway",     label: "Dirty Driveways",      color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "high-income",        label: "High-Income Area",     color: "bg-violet-100 text-violet-800 border-violet-300" },
  { key: "existing-cx-nearby", label: "Existing Customer Nearby", color: "bg-blue-100 text-blue-800 border-blue-300" },
];

function priorityColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 75) return "#2563eb";
  if (score >= 60) return "#d97706";
  return "#6b7280";
}

function LeadsMap({ leads, selectedId, onSelect }: { leads: typeof NEIGHBORHOOD_LEADS; selectedId: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    leads.forEach((lead) => {
      const color = priorityColor(lead.priority);
      const m = L.circleMarker([lead.lat, lead.lng], {
        radius: lead === leads[0] ? 14 : 11,
        fillColor: color, color: "white", weight: 2.5, fillOpacity: 0.9,
      })
        .bindPopup(`<strong>${lead.address}</strong><br/>Yard: ${lead.yardSqFt.toLocaleString()} sq ft<br/>Opportunity: ${lead.opportunity}<br/>AI Score: <strong>${lead.priority}</strong>`)
        .on("click", () => onSelect(lead.id));
      m.addTo(map);
      markersRef.current[lead.id] = m;
    });

    if (leads.length > 0) {
      const bounds = L.latLngBounds(leads.map((l) => [l.lat, l.lng] as L.LatLngExpression));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [leads, onSelect]);

  // Pulse selected marker
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, m]) => {
      if (id === selectedId) m.setStyle({ weight: 4, color: "#000" });
      else m.setStyle({ weight: 2.5, color: "white" });
    });
  }, [selectedId]);

  return <div ref={ref} className="absolute inset-0" />;
}

export default function NeighborhoodLeadMap() {
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleFilter = (key: FilterKey) =>
    setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);

  const filtered = NEIGHBORHOOD_LEADS.filter((lead) =>
    activeFilters.length === 0 || activeFilters.every((f) => lead.tags.includes(f))
  );

  const sorted = [...filtered].sort((a, b) => b.priority - a.priority);
  const selectedLead = NEIGHBORHOOD_LEADS.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Map className="h-6 w-6 text-primary" />Neighborhood Lead Map</h1>
            <p className="text-muted-foreground text-sm mt-0.5">AI-scored leads within your target territory. Click any pin for details.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => toggleFilter(f.key)} data-testid={`filter-${f.key}`}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
                  activeFilters.includes(f.key) ? f.color + " shadow-sm" : "bg-white border-zinc-200 text-muted-foreground hover:border-zinc-400")}>
                <Filter className="h-3 w-3" />{f.label}
                {activeFilters.includes(f.key) && <X className="h-3 w-3" />}
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground">Clear all</button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Score legend */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />AI Priority Score:</span>
          {[{ label: "90–100 — Hot lead", color: "#16a34a" }, { label: "75–89 — Warm", color: "#2563eb" }, { label: "60–74 — Moderate", color: "#d97706" }, { label: "<60 — Low", color: "#6b7280" }].map((s) => (
            <span key={s.label} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: s.color }} />{s.label}</span>
          ))}
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* Lead list */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground font-medium px-1 mb-3">{sorted.length} leads {activeFilters.length > 0 ? `(filtered)` : "in territory"}</p>
            {sorted.map((lead, i) => (
              <motion.div key={lead.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(lead.id === selectedId ? null : lead.id)} data-testid={`lead-card-${lead.id}`}
                className={cn("bg-white rounded-xl border p-3.5 cursor-pointer transition-all hover:shadow-sm",
                  selectedId === lead.id ? "border-primary shadow-sm ring-1 ring-primary/20" : "hover:border-zinc-300")}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: priorityColor(lead.priority) }}>
                    {lead.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{lead.address}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.opportunity}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Ruler className="h-2.5 w-2.5" />{lead.yardSqFt.toLocaleString()} sq ft</span>
                      {lead.hasNearbyCx && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Users className="h-2.5 w-2.5" />Nearby cx</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {sorted.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Map className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads match this filter combination.</p>
              </div>
            )}
          </div>

          {/* Map + detail panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ height: 500 }}>
              <div className="relative h-full">
                <LeadsMap leads={sorted} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            </div>

            {/* Selected lead detail */}
            <AnimatePresence>
              {selectedLead && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="bg-white rounded-2xl border p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: priorityColor(selectedLead.priority) }}>
                      {selectedLead.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{selectedLead.address}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedLead.opportunity}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-zinc-100 px-2.5 py-1 rounded-full"><strong>{selectedLead.yardSqFt.toLocaleString()}</strong> sq ft yard</span>
                        {selectedLead.tags.map((t) => {
                          const f = FILTERS.find((x) => x.key === t);
                          return f ? <span key={t} className={cn("text-xs px-2.5 py-1 rounded-full border", f.color)}>{f.label}</span> : null;
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                      <Button size="sm" className="gap-1" data-testid="btn-quote-lead"><Zap className="h-3.5 w-3.5" />Quote This Lead</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
