import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  isManual: boolean;
  onLocationChange: (lat: number, lon: number, isManual: boolean) => void;
  heightClass?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  accuracyM,
  onLocationChange,
  heightClass = 'h-64 sm:h-80'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: false,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom civic hazard pin
    const pinIcon = L.divIcon({
      className: 'citizen-location-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
            📍
          </div>
          <div style="position: absolute; bottom: -8px; width: 8px; height: 8px; background: #2563eb; transform: rotate(45deg);"></div>
        </div>
      `,
      iconSize: [32, 36],
      iconAnchor: [16, 36]
    });

    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: pinIcon
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng, true);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng, true);
    });

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker & circle when latitude / longitude changes externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.panTo([latitude, longitude]);

    if (accuracyM && accuracyM > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle([latitude, longitude], {
          radius: accuracyM,
          color: '#2563eb',
          weight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.15
        }).addTo(mapRef.current);
      } else {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(accuracyM);
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, [latitude, longitude, accuracyM]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 16);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={containerRef} className={`w-full ${heightClass} z-0`} />

      {/* Recenter helper button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 p-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 text-xs font-semibold transition"
        title="Recenter Pin"
      >
        <Crosshair size={14} className="text-blue-600" />
        <span>Center Pin</span>
      </button>

      {/* Helper instruction badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[11px] shadow">
        Tap map or drag pin to adjust
      </div>
    </div>
  );
};
