import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Custom SVG pin marker — avoids Vite bundling issues with Leaflet's default PNG assets
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="hsl(142.1,76.2%,36.3%)" stroke="white" stroke-width="2"/>
  <circle cx="14" cy="14" r="5" fill="white"/>
</svg>`;
const PIN_ICON = L.divIcon({
  html: PIN_SVG,
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
});

// Pre-computed coordinates for the four demo scenarios so geocoding is instant
const KNOWN_COORDS: Record<string, [number, number]> = {
  "1824 peachtree rd nw, atlanta": [33.8136, -84.3814],
  "562 magnolia dr, savannah":     [32.0609, -81.1074],
  "3310 piedmont ave, augusta":    [33.4735, -82.0105],
  "220 cedar court, roswell":      [34.0232, -84.3616],
};

function normalizeAddress(addr: string): string {
  return addr.toLowerCase().replace(/,\s*ga\s*\d{5}/i, "").trim();
}

async function geocode(address: string): Promise<[number, number] | null> {
  // Check hardcoded list first
  const key = normalizeAddress(address);
  for (const [k, v] of Object.entries(KNOWN_COORDS)) {
    if (key.includes(k)) return v;
  }

  // Fall back to Nominatim (OSM free geocoding — no API key)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    // silently fall through
  }
  return null;
}

interface PropertyMapProps {
  address: string;
  phase: "loading" | "scanning" | "done";
  progress: number;
}

export function PropertyMap({ address, phase, progress }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const overlayRef = useRef<L.Rectangle | null>(null);
  const [coordsFound, setCoordsFound] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    // Esri World Imagery — free, no API key, real satellite photos
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 20 }
    ).addTo(map);

    // Small attribution badge
    L.control.attribution({ prefix: false, position: "bottomright" })
      .addAttribution("Esri, Maxar, Earthstar Geographics")
      .addTo(map);

    mapRef.current = map;
    map.setView([33.749, -84.388], 18); // default Atlanta until geocode resolves

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Geocode address and fly map to it
  useEffect(() => {
    if (!mapRef.current || !address) return;
    let cancelled = false;

    geocode(address).then((coords) => {
      if (cancelled || !coords || !mapRef.current) return;
      setCoordsFound(true);
      mapRef.current.flyTo(coords, 19, { duration: 1.4, easeLinearity: 0.3 });

      // Drop a subtle marker
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker(coords, { icon: PIN_ICON }).addTo(mapRef.current);
    });

    return () => { cancelled = true; };
  }, [address]);

  // Draw the green boundary rectangle when scan is done
  useEffect(() => {
    if (!mapRef.current || !coordsFound) return;
    if (phase !== "done") {
      if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }
      return;
    }
    const center = mapRef.current.getCenter();
    const d = 0.00045;
    const bounds: L.LatLngBoundsExpression = [
      [center.lat - d, center.lng - d * 1.5],
      [center.lat + d, center.lng + d * 1.5],
    ];
    if (overlayRef.current) overlayRef.current.remove();
    overlayRef.current = L.rectangle(bounds, {
      color: "hsl(142.1, 76.2%, 36.3%)",
      weight: 3,
      fillColor: "hsl(142.1, 76.2%, 36.3%)",
      fillOpacity: 0.08,
    }).addTo(mapRef.current);
  }, [phase, coordsFound]);

  return (
    <div className="relative w-full h-full" data-testid="property-map-container">
      {/* Leaflet map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Scanning grid + sweep line overlay */}
      {(phase === "loading" || phase === "scanning") && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 500 }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(52,211,153,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.07) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              border: "2px solid rgba(52,211,153,0.45)",
            }}
          />
          <div
            className="absolute left-0 right-0 h-[3px]"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(142.1,76.2%,36.3%), transparent)",
              animation: "scanSweep 2s linear infinite",
              top: `${progress}%`,
              transition: "top 0.06s linear",
              zIndex: 501,
            }}
          />
        </div>
      )}
    </div>
  );
}
