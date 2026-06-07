import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { Navigation, Clock, Fuel, Users, CheckCircle2, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTE_STOPS, CREWS } from "@/lib/mock-data";

const PIN_COLORS: Record<string, string> = { A: "#16a34a", B: "#2563eb" };

function buildIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:13px;font-family:Inter,sans-serif;">${label}</div>`,
    className: "", iconSize: [32, 32], iconAnchor: [16, 16],
  });
}

function RouteMap({ stops, optimized }: { stops: typeof ROUTE_STOPS; optimized: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((l) => { if (l instanceof L.Marker || l instanceof L.Polyline) l.remove(); });

    const crewAStops = stops.filter((s) => s.crewId === "A");
    const crewBStops = stops.filter((s) => s.crewId === "B");

    // Draw polylines
    L.polyline(crewAStops.map((s) => [s.lat, s.lng] as L.LatLngExpression), { color: PIN_COLORS.A, weight: 3, opacity: 0.7, dashArray: optimized ? undefined : "6 4" }).addTo(map);
    L.polyline(crewBStops.map((s) => [s.lat, s.lng] as L.LatLngExpression), { color: PIN_COLORS.B, weight: 3, opacity: 0.7, dashArray: optimized ? undefined : "6 4" }).addTo(map);

    // Add markers
    stops.forEach((stop) => {
      const icon = buildIcon(stop.id.toString(), PIN_COLORS[stop.crewId]);
      L.marker([stop.lat, stop.lng], { icon })
        .bindPopup(`<strong>${stop.label}</strong><br/>${stop.customer}<br/><em>${stop.service}</em><br/>${stop.duration} min`)
        .addTo(map);
    });

    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as L.LatLngExpression));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [stops, optimized]);

  return <div ref={ref} className="absolute inset-0" />;
}

export default function RouteOptimization() {
  const [optimized, setOptimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const stops = optimized
    ? [...ROUTE_STOPS].sort((a, b) => {
        if (a.crewId !== b.crewId) return a.crewId.localeCompare(b.crewId);
        // Optimize: sort by lat (north to south) within crew
        return b.lat - a.lat;
      })
    : ROUTE_STOPS;

  const totalDriveTime = optimized ? 52 : 78;
  const fuelSaved = optimized ? 3.2 : 0;
  const totalJobTime = stops.reduce((acc, s) => acc + s.duration, 0);

  const handleOptimize = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setOptimized(true); }, 1800);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Navigation className="h-6 w-6 text-primary" />Route Optimization</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Today — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex gap-3">
            {optimized && (
              <Button variant="outline" onClick={() => setOptimized(false)} className="gap-2"><RotateCcw className="h-4 w-4" />Reset</Button>
            )}
            <Button onClick={handleOptimize} disabled={loading || optimized} className="gap-2 min-w-[160px]" data-testid="btn-optimize-route">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Optimizing…</> : optimized ? <><CheckCircle2 className="h-4 w-4" />Route Optimized</> : <><Zap className="h-4 w-4" />Optimize Route</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Navigation, label: "Total Stops", value: `${stops.length}`, color: "text-primary" },
            { icon: Clock, label: "Est. Drive Time", value: `${totalDriveTime} min`, color: optimized ? "text-emerald-600" : "text-foreground", sub: optimized ? `↓ ${78 - totalDriveTime} min saved` : undefined },
            { icon: Users, label: "Service Time", value: `${totalJobTime} min`, color: "text-foreground" },
            { icon: Fuel, label: "Fuel Saved", value: optimized ? `${fuelSaved} gal` : "—", color: optimized ? "text-emerald-600" : "text-muted-foreground", sub: optimized ? "≈ $12.80 saved" : "Run optimizer first" },
          ].map((kpi, i) => (
            <motion.div key={i} className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><kpi.icon className="h-3.5 w-3.5" />{kpi.label}</div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-emerald-600 mt-0.5">{kpi.sub}</p>}
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {CREWS.map((crew) => {
              const crewStops = stops.filter((s) => s.crewId === crew.id);
              const color = PIN_COLORS[crew.id];
              return (
                <div key={crew.id} className="bg-white rounded-2xl border overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
                    <div>
                      <p className="font-bold text-sm">{crew.name}</p>
                      <p className="text-xs text-muted-foreground">{crew.truck} · {crew.members.join(", ")}</p>
                    </div>
                    <Badge className="ml-auto" style={{ background: color }}>{crewStops.length} stops</Badge>
                  </div>
                  <div className="divide-y">
                    {crewStops.map((stop, i) => (
                      <motion.div key={stop.id} layout className="flex items-start gap-3 px-4 py-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: color }}>{stop.id}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{stop.customer}</p>
                          <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stop.service} · {stop.duration} min</p>
                        </div>
                        {i === 0 && optimized && <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 flex-shrink-0">First</Badge>}
                      </motion.div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 bg-muted/30 text-xs text-muted-foreground border-t">
                    Est. job time: {crewStops.reduce((acc, s) => acc + s.duration, 0)} min
                  </div>
                </div>
              );
            })}

            {optimized && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="font-semibold text-emerald-800 text-sm mb-1 flex items-center gap-2"><Zap className="h-4 w-4" />Route optimized!</p>
                <p className="text-xs text-emerald-700">Saved {78 - totalDriveTime} minutes of drive time and {fuelSaved} gallons of fuel vs. original order.</p>
              </motion.div>
            )}
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ minHeight: 520 }}>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="font-semibold text-sm">Live Route Map</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-600 inline-block" />Crew Alpha</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-blue-600 inline-block" />Crew Beta</span>
              </div>
            </div>
            <div className="relative" style={{ height: 480 }}>
              <RouteMap stops={stops} optimized={optimized} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
