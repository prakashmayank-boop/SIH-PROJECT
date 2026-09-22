import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  FlaskConical,
  CloudRain,
  Layers,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Activity,
  Droplet
} from 'lucide-react';
import { apiService } from '../services/api';
import type { HorizonStep, ForecastSummary } from '../types';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHorizon: HorizonStep;
  onSimulationApplied: () => void;
}

const PRESET_SCENARIOS = [
  { id: 'light_20', label: 'Light Rain (20 mm/h)', intensity: 20, color: '#10b981' },
  { id: 'monsoon_65', label: 'Monsoon Downpour (68 mm/h)', intensity: 68, color: '#f59e0b' },
  { id: 'cloudburst_110', label: 'Urban Cloudburst (115 mm/h)', intensity: 115, color: '#ef4444' },
];

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentHorizon,
  onSimulationApplied
}) => {
  const [rainfall, setRainfall] = useState<number>(68);
  const [activePreset, setActivePreset] = useState<string | null>('monsoon_65');
  const [edgeBlockages, setEdgeBlockages] = useState<Record<string, number>>({
    'MH-01→MH-04': 0,
    'MH-04→MH-07': 0
  });

  const [previewSummary, setPreviewSummary] = useState<ForecastSummary | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);

  // Fetch live preview strip data from backend
  const updateBackendPreview = useCallback(async (rainIntensity: number) => {
    setIsPreviewLoading(true);
    try {
      await apiService.switchScenario('custom', rainIntensity);
      const sum = await apiService.getForecastSummary(currentHorizon);
      setPreviewSummary(sum);
    } catch (err) {
      console.error('Failed to query preview KPI strip:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [currentHorizon]);

  // Initial fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      updateBackendPreview(rainfall);
    }
  }, [isOpen, updateBackendPreview]);

  // Debounced update on slider release / drag settle
  const queuePreviewUpdate = (val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateBackendPreview(val);
    }, 250);
  };

  const handleRainfallChange = (val: number) => {
    setRainfall(val);
    setActivePreset(null);
    queuePreviewUpdate(val);
  };

  const handlePresetSelect = (preset: typeof PRESET_SCENARIOS[number]) => {
    setRainfall(preset.intensity);
    setActivePreset(preset.id);
    updateBackendPreview(preset.intensity);
  };

  const toggleEdgeBlockage = async (edgeKey: string) => {
    const nextVal = edgeBlockages[edgeKey] === 0 ? 70 : 0;
    setEdgeBlockages(prev => ({
      ...prev,
      [edgeKey]: nextVal
    }));
    try {
      await apiService.updateEdgeBlockage(edgeKey, nextVal);
      queuePreviewUpdate(rainfall);
    } catch (err) {
      console.error('Failed to update edge blockage:', err);
    }
  };

  const handleResetDefaults = async () => {
    setRainfall(68);
    setActivePreset('monsoon_65');
    setEdgeBlockages({
      'MH-01→MH-04': 0,
      'MH-04→MH-07': 0
    });
    setIsPreviewLoading(true);
    try {
      await Promise.all([
        apiService.updateEdgeBlockage('MH-01→MH-04', 0),
        apiService.updateEdgeBlockage('MH-04→MH-07', 0),
        apiService.switchScenario('monsoon_65')
      ]);
      const sum = await apiService.getForecastSummary(currentHorizon);
      setPreviewSummary(sum);
    } catch (err) {
      console.error('Failed to reset scenario defaults:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await apiService.switchScenario('custom', rainfall);
      onSimulationApplied();
      onClose();
    } catch (err) {
      console.error('What-If simulation failed to apply:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const riskColor = rainfall < 35 ? '#10b981' : rainfall < 80 ? '#f59e0b' : '#ef4444';
  const riskLabel = rainfall < 35 ? 'Low Inundation Risk' : rainfall < 80 ? 'Moderate Ponding' : 'Severe Urban Flash Flood';

  // Preview metrics with fallbacks
  const previewMaxDepth = previewSummary?.max_predicted_depth_cm ?? Math.round(rainfall * 0.28);
  const previewCriticalRoads = previewSummary?.critical_road_count ?? (rainfall > 80 ? 5 : rainfall > 40 ? 2 : 0);
  const previewRiskIndex = previewSummary?.flood_risk_index ?? Math.min(100, Math.round((rainfall / 140) * 100));

  return (
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box" style={{ maxWidth: 600 }}>

        {/* Modal Header */}
        <div className="ar-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] shadow-inner">
              <FlaskConical size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#0F172A] tracking-wide">What-If Scenario Simulator</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">
                  Hydro-Sim
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Stress-test urban catchment response across dynamic rainfall & pipe blockages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ar-modal-close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">

          {/* 1. Preset Scenarios Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86948a] flex items-center gap-1.5">
                <Sliders size={12} className="text-[#38bdf8]" />
                Calibrated Rain Benchmarks
              </span>
              <span className="text-[10px] text-[#64748b]">Horizon: {currentHorizon}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    activePreset === p.id
                      ? 'border-current shadow-lg'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={{
                    borderColor: activePreset === p.id ? p.color : undefined,
                    backgroundColor: activePreset === p.id ? `${p.color}15` : undefined
                  }}
                >
                  <CloudRain size={16} className="mx-auto mb-1" style={{ color: p.color }} />
                  <p className="text-[11px] font-bold text-[#0F172A] leading-tight">{p.label.split('(')[0].trim()}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: p.color }}>{p.intensity} mm/h</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Rainfall Intensity Slider (0-200 mm/h) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet size={15} className="text-[#38bdf8]" />
                <span className="text-xs font-bold text-[#0F172A]">Rainfall Intensity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold data-mono" style={{ color: riskColor }}>
                  {rainfall}
                </span>
                <span className="text-xs text-[#64748b]">mm/h</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
                >
                  {riskLabel}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={rainfall}
                onChange={e => handleRainfallChange(Number(e.target.value))}
                onMouseUp={() => updateBackendPreview(rainfall)}
                onTouchEnd={() => updateBackendPreview(rainfall)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#38bdf8] bg-slate-200"
                style={{
                  background: `linear-gradient(to right, ${riskColor} 0%, ${riskColor} ${(rainfall / 200) * 100}%, #E2E8F0 ${(rainfall / 200) * 100}%, #E2E8F0 100%)`
                }}
              />
              {/* Benchmark calibration marks */}
              <div className="flex justify-between text-[10px] text-[#64748b] pt-1 font-mono">
                <span className="cursor-pointer hover:text-[#0F172A]" onClick={() => handleRainfallChange(0)}>0 mm/h</span>
                <span className="cursor-pointer hover:text-[#10b981]" onClick={() => handleRainfallChange(20)}>20 (Light)</span>
                <span className="cursor-pointer hover:text-[#f59e0b]" onClick={() => handleRainfallChange(65)}>65 (Monsoon)</span>
                <span className="cursor-pointer hover:text-[#ef4444]" onClick={() => handleRainfallChange(110)}>110 (Cloudburst)</span>
                <span className="cursor-pointer hover:text-[#0F172A]" onClick={() => handleRainfallChange(200)}>200</span>
              </div>
            </div>
          </div>

          {/* 3. Pipe Blockage Toggles for Key Critical Edges */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[#a78bfa]" />
                <span className="text-xs font-bold text-[#0F172A]">Critical Conduit Surcharge / Blockage</span>
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">Simulated Overlay</span>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { key: 'MH-01→MH-04', label: 'Trunk Line: MH-01 → MH-04 (ST Bed Bottleneck)', normalCap: '2.4 m³/s' },
                { key: 'MH-04→MH-07', label: 'Culvert Outfall: MH-04 → MH-07 (Sony World)', normalCap: '3.1 m³/s' }
              ].map(edge => {
                const isBlocked = edgeBlockages[edge.key] > 0;
                return (
                  <div
                    key={edge.key}
                    onClick={() => toggleEdgeBlockage(edge.key)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isBlocked
                        ? 'bg-[#a78bfa]/10 border-[#a78bfa]/40 text-[#0F172A]'
                        : 'bg-white border-slate-200 text-[#475569] hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-[#0F172A]">{edge.label}</p>
                      <p className="text-[10px] text-[#64748b]">Nominal capacity: {edge.normalCap}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isBlocked ? 'bg-[#a78bfa] text-white font-mono' : 'bg-slate-100 text-[#64748b]'
                      }`}>
                        {isBlocked ? '70% Silted / Surcharged' : '0% Clean'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Live Backend KPI Preview Strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-[#0284C7]/25 shadow-sm space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                <Activity size={14} className="text-[#0284C7]" />
                <span>Live Predictive Catchment Impact</span>
              </div>
              {isPreviewLoading && (
                <div className="flex items-center gap-1 text-[10px] text-[#0284C7]">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Calculating 1D-2D Hydrodynamic Response...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748b] block">Peak Depth</span>
                <span className="text-xl font-bold data-mono" style={{ color: riskColor }}>
                  {previewMaxDepth} <span className="text-xs font-normal">cm</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748b] block">Critical Roads</span>
                <span className="text-xl font-bold data-mono text-[#D97706]">
                  {previewCriticalRoads} <span className="text-xs font-normal">segments</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748b] block">Flood Risk Index</span>
                <span className="text-xl font-bold data-mono text-[#0F172A]">
                  {previewRiskIndex} <span className="text-xs font-normal">/ 100</span>
                </span>
              </div>
            </div>

            {rainfall >= 100 && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[10px] text-[#ef4444] mt-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>
                  Severe cloudburst condition: Overland flow exceeds stormwater capacity. Low-lying corridors (Sony World Signal, ST Bed) require emergency vehicle restriction.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="ar-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            onClick={handleResetDefaults}
            disabled={isApplying || isPreviewLoading}
            className="ar-btn-secondary"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
          >
            <RotateCcw size={13} />
            Reset Defaults (68 mm/h)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="ar-btn-secondary"
              style={{ width: 'auto', padding: '7px 16px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="ar-btn-primary"
              style={{ width: 'auto', padding: '7px 18px' }}
            >
              {isApplying ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Applying Scenario...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Apply to Live Map
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
