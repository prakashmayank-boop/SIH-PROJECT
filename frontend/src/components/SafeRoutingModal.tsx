import React, { useState } from 'react';
import { X, Navigation, Truck, Car, Siren, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import type { SafeRouteResult, HorizonStep } from '../types';
import { apiService } from '../services/api';

interface SafeRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRoute: (route: SafeRouteResult) => void;
  currentHorizon: HorizonStep;
}

// Koramangala Ward 151 landmark presets with precise coordinates [lat, lon]
const LOCATION_PRESETS: { label: string; coords: [number, number] }[] = [
  { label: "St. John's Hospital / 80ft Link", coords: [12.9365, 77.6230] },
  { label: 'Sony World Junction', coords: [12.9280, 77.6330] },
  { label: 'ST Bed (Suddaguntepalya)', coords: [12.9310, 77.6270] },
  { label: 'Wipro Park / Sarjapur Rd', coords: [12.9240, 77.6360] },
  { label: 'Koramangala Club / 4th Block', coords: [12.9380, 77.6280] },
  { label: 'Ejipura Main Road', coords: [12.9400, 77.6240] },
  { label: 'BDA Complex / 5th Block', coords: [12.9350, 77.6320] },
];

export const SafeRoutingModal: React.FC<SafeRoutingModalProps> = ({
  isOpen,
  onClose,
  onApplyRoute,
  currentHorizon
}) => {
  const [vehicleType, setVehicleType] = useState('ambulance');
  const [originIdx, setOriginIdx] = useState(0);
  const [destIdx, setDestIdx] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafeRouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCalculateRoute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const startCoord = LOCATION_PRESETS[originIdx].coords;
      const endCoord = LOCATION_PRESETS[destIdx].coords;
      const routeRes = await apiService.getSafeRoute(startCoord, endCoord, vehicleType, currentHorizon);
      setResult(routeRes);
      setError(null);
      // Apply route to map — done outside the catch so it can't create a false error
      try { onApplyRoute(routeRes); } catch (_) { /* apply is fire-and-forget */ }
    } catch (err: any) {
      setError('Failed to calculate safe route. Please verify endpoints or check backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndView = () => {
    if (result) {
      onApplyRoute(result);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c2d] border border-[rgba(255,255,255,0.15)] rounded-lg w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Navigation size={18} className="text-[#10b981]" />
            <h3 className="font-bold text-sm">Dynamic Flood-Aware Routing Engine</h3>
          </div>
          <button onClick={onClose} className="text-[#86948a] hover:text-white p-1 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Vehicle Type Selector */}
          <div>
            <label className="text-[11px] font-semibold text-[#86948a] uppercase tracking-wider block mb-2">
              Vehicle Profile (Clearance Threshold)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ambulance', label: 'Ambulance', sub: 'Max 22cm', icon: Siren },
                { id: 'rescue_truck', label: 'Rescue Truck', sub: 'Max 38cm', icon: Truck },
                { id: 'car', label: 'Passenger Car', sub: 'Max 12cm', icon: Car }
              ].map(v => {
                const Icon = v.icon;
                const active = vehicleType === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id)}
                    className={`p-2.5 rounded border text-left flex flex-col items-start gap-1 transition-all ${
                      active
                        ? 'bg-[#10b981]/15 border-[#10b981] text-white shadow-sm'
                        : 'bg-[#152031] border-[rgba(255,255,255,0.08)] text-[#86948a] hover:border-[rgba(255,255,255,0.2)]'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[#10b981]' : 'text-[#86948a]'} />
                    <span className="font-bold text-xs text-white">{v.label}</span>
                    <span className="text-[10px] text-[#86948a]">{v.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Landmark Preset Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1 flex items-center gap-1">
                <MapPin size={10} className="text-[#10b981]" /> Origin Point
              </label>
              <select
                value={originIdx}
                onChange={e => setOriginIdx(Number(e.target.value))}
                className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white text-xs outline-none focus:border-[#10b981] cursor-pointer"
              >
                {LOCATION_PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <div className="mt-1 text-[10px] text-[#64748b] font-mono">
                {LOCATION_PRESETS[originIdx].coords[0].toFixed(4)}, {LOCATION_PRESETS[originIdx].coords[1].toFixed(4)}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-[#86948a] block mb-1 flex items-center gap-1">
                <MapPin size={10} className="text-[#ef4444]" /> Destination Point
              </label>
              <select
                value={destIdx}
                onChange={e => setDestIdx(Number(e.target.value))}
                className="w-full bg-[#081425] border border-[rgba(255,255,255,0.1)] rounded p-2 text-white text-xs outline-none focus:border-[#10b981] cursor-pointer"
              >
                {LOCATION_PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <div className="mt-1 text-[10px] text-[#64748b] font-mono">
                {LOCATION_PRESETS[destIdx].coords[0].toFixed(4)}, {LOCATION_PRESETS[destIdx].coords[1].toFixed(4)}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleCalculateRoute}
            disabled={loading || originIdx === destIdx}
            className="w-full btn-primary justify-center py-2.5 text-xs font-bold disabled:opacity-50"
          >
            <Navigation size={14} />
            {loading ? 'Evaluating Hydrologic Impassability...' : 'Compute Lowest-Risk Route'}
          </button>

          {/* Results Comparison Card */}
          {result && (
            <div className="mt-4 space-y-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <div className="grid grid-cols-2 gap-3">
                {/* Standard Route */}
                <div className="glass-panel p-3 border-l-2 border-l-[#ef4444] bg-[#ef4444]/5">
                  <div className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider">
                    Standard Route (Direct)
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    {result.normal_route.distance_m} m • {Math.round(result.normal_route.duration_seconds / 60)} min
                  </div>
                  <div className="mt-1 text-[11px] text-[#ef4444] font-semibold">
                    Max Depth: {result.normal_route.max_depth_cm} cm (Hazard)
                  </div>
                </div>

                {/* Lowest Risk Route */}
                <div className="glass-panel p-3 border-l-2 border-l-[#10b981] bg-[#10b981]/10">
                  <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                    Lowest Predicted Risk Route
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    {result.flood_safe_route.distance_m} m • {Math.round(result.flood_safe_route.duration_seconds / 60)} min
                  </div>
                  <div className="mt-1 text-[11px] text-[#10b981] font-semibold">
                    Max Depth: {result.flood_safe_route.max_depth_cm} cm (Passable)
                  </div>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-2.5 rounded bg-[#081425] text-[11px] text-[#86948a] border border-[rgba(255,255,255,0.08)] leading-relaxed">
                <span className="font-semibold text-white">Route Analysis: </span>
                {result.savings_explanation}
              </div>

              {/* Apply Route CTA */}
              <button
                onClick={handleApplyAndView}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)'
                }}
              >
                <CheckCircle2 size={14} />
                Apply Route & View on Map
              </button>

              <div className="text-[10px] text-[#86948a] italic">
                * Note: UFIS recommends lower predicted flood-risk routes based on dynamic nowcasting. Always follow on-ground emergency police directions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
