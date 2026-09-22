import React, { useState } from 'react';
import { X, Navigation, Truck, Car, Siren, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import type { SafeRouteResult, HorizonStep } from '../types';
import { apiService } from '../services/api';
import './admin-portal.css';

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
      try { onApplyRoute(routeRes); } catch (_) { /* fire-and-forget */ }
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
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box">
        {/* Modal Header */}
        <div className="ar-modal-header">
          <div className="ar-modal-title">
            <Navigation size={18} className="text-[#10b981]" />
            <span>Dynamic Flood-Aware Routing Engine</span>
          </div>
          <button onClick={onClose} className="ar-modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ar-modal-body">
          {/* Vehicle Type Selector */}
          <div className="ar-field">
            <label className="ar-field-label">
              Vehicle Profile (Hydraulic Clearance Threshold)
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
                    className={`p-3 rounded-lg border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-50 border-[#059669] text-[#0F172A] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-[#475569] hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[#059669]' : 'text-[#64748B]'} />
                    <span className="font-bold text-xs text-[#0F172A]">{v.label}</span>
                    <span className="text-[10px] text-[#64748B] ar-mono">{v.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Landmark Preset Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ar-field">
              <label className="ar-field-label flex items-center gap-1">
                <MapPin size={11} className="text-[#10b981]" /> Origin Landmark
              </label>
              <select
                value={originIdx}
                onChange={e => setOriginIdx(Number(e.target.value))}
                className="ar-field-select cursor-pointer"
              >
                {LOCATION_PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <div className="text-[10px] text-[#64748b] ar-mono mt-0.5">
                {LOCATION_PRESETS[originIdx].coords[0].toFixed(4)}°N, {LOCATION_PRESETS[originIdx].coords[1].toFixed(4)}°E
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-field-label flex items-center gap-1">
                <MapPin size={11} className="text-[#ef4444]" /> Destination Landmark
              </label>
              <select
                value={destIdx}
                onChange={e => setDestIdx(Number(e.target.value))}
                className="ar-field-select cursor-pointer"
              >
                {LOCATION_PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <div className="text-[10px] text-[#64748b] ar-mono mt-0.5">
                {LOCATION_PRESETS[destIdx].coords[0].toFixed(4)}°N, {LOCATION_PRESETS[destIdx].coords[1].toFixed(4)}°E
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleCalculateRoute}
            disabled={loading || originIdx === destIdx}
            className="ar-btn-primary py-3"
            style={{ width: '100%' }}
          >
            <Navigation size={14} />
            {loading ? 'Evaluating Hydrologic Impassability...' : 'Compute Lowest-Risk Route'}
          </button>

          {/* Results Comparison Card */}
          {result && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                {/* Standard Route */}
                <div className="ar-card ar-card--stressed p-3">
                  <div className="text-[10px] font-bold text-[#dc2626] uppercase tracking-wider">
                    Standard Shortest Route
                  </div>
                  <div className="text-[#0F172A] font-bold text-sm ar-mono mt-0.5">
                    {result.normal_route.distance_m}m &bull; {Math.round(result.normal_route.duration_seconds / 60)}min
                  </div>
                  <div className="text-[11px] text-[#dc2626] font-semibold ar-mono">
                    Max Depth: {result.normal_route.max_depth_cm} cm (Hazard)
                  </div>
                </div>

                {/* Lowest Risk Route */}
                <div className="ar-card ar-card--nominal p-3">
                  <div className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">
                    UFIS Flood-Safe Detour
                  </div>
                  <div className="text-[#0F172A] font-bold text-sm ar-mono mt-0.5">
                    {result.flood_safe_route.distance_m}m &bull; {Math.round(result.flood_safe_route.duration_seconds / 60)}min
                  </div>
                  <div className="text-[11px] text-[#059669] font-semibold ar-mono">
                    Max Depth: {result.flood_safe_route.max_depth_cm} cm (Passable)
                  </div>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-[#475569] border border-slate-200 leading-relaxed">
                <span className="font-semibold text-[#0F172A]">Route Analysis: </span>
                {result.savings_explanation}
              </div>

              {/* Apply Route CTA */}
              <button
                onClick={handleApplyAndView}
                className="ar-btn-primary py-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)'
                }}
              >
                <CheckCircle2 size={14} />
                Apply Route to Active Map HUD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
