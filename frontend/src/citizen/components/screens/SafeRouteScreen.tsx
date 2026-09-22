import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Car,
  Footprints,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import type { SafeRouteResult, SupportedLanguage } from '../../types';

import { TRANSLATIONS } from '../../i18n/translations';
import { citizenApiService } from '../../services/citizenApi';

interface SafeRouteScreenProps {
  lang: SupportedLanguage;
  onBack: () => void;
}

const ROUTE_PRESETS = [
  {
    name: "St. John's Hospital to Sony World Junction",
    origin: { name: "St. John's Hospital Main Gate", lat: 12.9345, lon: 77.6230 },
    destination: { name: "Sony World Signal (80 Feet Rd)", lat: 12.9280, lon: 77.6330 }
  },
  {
    name: "Koramangala 1st Block Underpass to BDA Complex",
    origin: { name: "Koramangala 1st Block Underpass", lat: 12.9365, lon: 77.6200 },
    destination: { name: "BDA Complex Commercial Basin", lat: 12.9350, lon: 77.6320 }
  },
  {
    name: "Ejipura Link Road to ST Bed High Ground",
    origin: { name: "Ejipura Canal Link Road", lat: 12.9400, lon: 77.6240 },
    destination: { name: "ST Bed Signal / 80 Feet Main", lat: 12.9310, lon: 77.6270 }
  }
];

export const SafeRouteScreen: React.FC<SafeRouteScreenProps> = ({ lang, onBack }) => {
  const t = TRANSLATIONS[lang];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<{
    safeLayer: L.Polyline | null;
    directLayer: L.Polyline | null;
    markers: L.Marker[];
  }>({
    safeLayer: null,
    directLayer: null,
    markers: []
  });

  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [travelMode, setTravelMode] = useState<'pedestrian' | 'two_wheeler' | 'car' | 'suv'>('car');
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = useCallback(
    async (presetIdx: number, mode: 'pedestrian' | 'two_wheeler' | 'car' | 'suv') => {
      setIsLoading(true);
      const preset = ROUTE_PRESETS[presetIdx];

      try {
        const result = await citizenApiService.getSafeRoute({
          origin_lat: preset.origin.lat,
          origin_lon: preset.origin.lon,
          origin_name: preset.origin.name,
          destination_lat: preset.destination.lat,
          destination_lon: preset.destination.lon,
          destination_name: preset.destination.name,
          travel_mode: mode
        });

        setRouteResult(result);
        renderRouteOnMap(result, preset.origin, preset.destination);
      } catch (err) {
        console.error('Route calculation error', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9320, 77.6280],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    // Run initial route calculation
    handleCalculate(0, travelMode);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [handleCalculate, travelMode]);


  const renderRouteOnMap = (
    result: SafeRouteResult,
    origin: { lat: number; lon: number; name: string },
    destination: { lat: number; lon: number; name: string }
  ) => {
    const map = mapRef.current;
    if (!map) return;

    // Clean previous layers
    if (routeLayersRef.current.safeLayer) {
      routeLayersRef.current.safeLayer.remove();
    }
    if (routeLayersRef.current.directLayer) {
      routeLayersRef.current.directLayer.remove();
    }
    routeLayersRef.current.markers.forEach((m) => m.remove());
    routeLayersRef.current.markers = [];

    // Draw Inundated Direct Route (dashed red line)
    if (result.direct_coordinates && result.direct_coordinates.length > 0) {
      const directLine = L.polyline(result.direct_coordinates, {
        color: '#ef4444',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);
      directLine.bindPopup('<b>Direct Road (High Inundation Risk)</b><br>Predicted water depth exceeds 24 cm.');
      routeLayersRef.current.directLayer = directLine;
    }

    // Draw Safe Route (solid emerald line with pulse effect)
    const safeLine = L.polyline(result.safe_coordinates, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95
    }).addTo(map);
    safeLine.bindPopup(`<b>Recommended Safe Path</b><br>Flood depth: &le; ${result.max_flood_depth_cm} cm.`);
    routeLayersRef.current.safeLayer = safeLine;

    // Start marker
    const startIcon = L.divIcon({
      className: 'route-start-pin',
      html: `
        <div style="background: #2563eb; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          A
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    const startMarker = L.marker([origin.lat, origin.lon], { icon: startIcon }).addTo(map);
    startMarker.bindPopup(`<b>Origin:</b> ${origin.name}`);

    // End marker
    const endIcon = L.divIcon({
      className: 'route-end-pin',
      html: `
        <div style="background: #10b981; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          B
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    const endMarker = L.marker([destination.lat, destination.lon], { icon: endIcon }).addTo(map);
    endMarker.bindPopup(`<b>Destination:</b> ${destination.name}`);

    routeLayersRef.current.markers = [startMarker, endMarker];

    // Fit map bounds
    const bounds = L.latLngBounds([
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
      ...result.safe_coordinates
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{t.safeRouteTitle}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.safeRouteSubtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Navigation size={20} />
        </div>
      </div>

      {/* Preset Route Selector & Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Common Monsoon Transit Corridor
          </label>
          <select
            value={selectedPresetIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedPresetIdx(idx);
              handleCalculate(idx, travelMode);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-blue-600 cursor-pointer"
          >
            {ROUTE_PRESETS.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Travel Mode Selector */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t.travelModeLabel}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'pedestrian', label: 'Walk', icon: <Footprints size={14} /> },
              { id: 'two_wheeler', label: '2-Wheeler', icon: <Car size={14} /> },
              { id: 'car', label: 'Car', icon: <Car size={14} /> },
              { id: 'suv', label: 'SUV', icon: <ShieldCheck size={14} /> }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const mode = m.id as any;
                  setTravelMode(mode);
                  handleCalculate(selectedPresetIdx, mode);
                }}
                className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  travelMode === m.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.icon}
                <span className="text-[10px]">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Safe Route Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div ref={mapContainerRef} className="w-full h-72 sm:h-80 z-0" />

        {/* Map Legend Overlay */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-slate-200 shadow-md text-[11px] space-y-1.5 max-w-[240px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
            <span className="font-semibold text-slate-800">Safe Route (Depth &lt; 5cm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0 border-t-2 border-dashed border-red-500 shrink-0" />
            <span className="text-slate-600">Avoided Flooded Roads</span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center z-20">
            <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Simulating Flood-Safe Path...</span>
            </div>
          </div>
        )}
      </div>

      {/* Calculated Route Metrics & Advisories */}
      {routeResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Distance</span>
              <span className="text-sm font-bold text-slate-900">
                {(routeResult.distance_meters / 1000).toFixed(1)} km
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Est. Time</span>
              <span className="text-sm font-bold text-slate-900">
                {routeResult.duration_minutes} min
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Max Water Depth</span>
              <span className="text-sm font-bold text-emerald-600">
                {routeResult.max_flood_depth_cm} cm
              </span>
            </div>
          </div>

          {/* Road Network Segments Traversed */}
          {routeResult.road_names && routeResult.road_names.length > 0 && (
            <div className="space-y-1.5 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Roads Followed (OSM Geometry):
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Real Road Geometry
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {routeResult.road_names.map((road, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-lg"
                  >
                    <span className="text-blue-500 font-bold">{idx + 1}.</span> {road}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Route Analysis & Savings Explanation */}
          {routeResult.savings_explanation && (
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold text-blue-950">Routing Intelligence: </span>
              {routeResult.savings_explanation}
            </div>
          )}

          {/* Avoided Flood Spots */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              Inundated Hotspots Avoided on this Path:
            </span>
            <ul className="space-y-1">
              {routeResult.inundation_spots_avoided.map((spot, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>{spot}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Warning */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Precaution:</strong> {routeResult.safety_notice} Never attempt to drive through fast-moving water or unbarricaded road depressions.
            </p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>{t.btnBackHome}</span>
        </button>
      </div>
    </div>
  );
};
