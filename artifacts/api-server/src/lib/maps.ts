import { Client } from "@googlemaps/google-maps-services-js";
import { logger } from "./logger";

let _client: Client | null = null;
function getMapsClient(): Client {
  if (!_client) _client = new Client({});
  return _client;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

// Address string → coordinates via the Google Geocoding API.
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    logger.warn("GOOGLE_MAPS_API_KEY not set — skipping geocode");
    return null;
  }
  try {
    const res = await getMapsClient().geocode({ params: { address, key } });
    const first = res.data.results[0];
    if (!first) return null;
    return {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      formattedAddress: first.formatted_address,
    };
  } catch (err) {
    logger.warn({ err }, "Geocode failed");
    return null;
  }
}

export interface SatelliteImage {
  dataUrl: string; // base64 data URL, ready to pass to a vision model
  metersPerPixel: number; // ground resolution — lets the model convert pixels → sqft
  sizePx: number; // width/height of the returned image in pixels
}

// Fetch a top-down satellite image centered on lat/lng as a base64 data URL.
// Includes the real-world scale (meters per pixel) so a vision model can measure area.
export async function fetchSatelliteImage(
  lat: number,
  lng: number,
  zoom = 20
): Promise<SatelliteImage | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const baseSize = 640; // Static Maps max free tile size
  const scale = 2; // retina — doubles effective pixels
  const sizePx = baseSize * scale;

  // Web-Mercator ground resolution at this zoom & latitude, adjusted for scale.
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom) / scale;

  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=${zoom}&size=${baseSize}x${baseSize}&scale=${scale}` +
    `&maptype=satellite&key=${key}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn({ status: res.status }, "Static Maps fetch failed");
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      dataUrl: `data:image/png;base64,${buf.toString("base64")}`,
      metersPerPixel,
      sizePx,
    };
  } catch (err) {
    logger.warn({ err }, "Static Maps fetch error");
    return null;
  }
}
