import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  X,
  GitCommit,
  Route,
  Navigation,
  Wrench,
  Info,
  Cpu,
  Sparkles,
  Send
} from 'lucide-react';
import type { AlertItem, RoadFeature, DrainageNode } from '../types';

interface InspectorPanelProps {
  alerts: AlertItem[];
  selectedRoad: RoadFeature | null;
  selectedNode: DrainageNode | null;
  onClearSelection: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onCreateTaskForNode: (node: DrainageNode) => void;
  onFindRouteForRoad: (road: RoadFeature) => void;
  onOpenSmsModal?: (alert?: AlertItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  alerts,
  selectedRoad,
  selectedNode,
  onClearSelection,
  onAcknowledgeAlert,
  onCreateTaskForNode,
  onFindRouteForRoad,
  onOpenSmsModal,
  isCollapsed,
  onToggleCollapse
}) => {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute top-4 right-4 z-20 glass-panel p-2.5 text-[#86948a] hover:text-white shadow-xl flex items-center gap-1.5 text-xs font-semibold"
      >
        <AlertTriangle size={14} className="text-[#ef4444]" />
        <span>Operational Inspector</span>
      </button>
    );
  }

  return (
    <aside style={{ width: 300, minWidth: 300 }} className="h-full bg-[#0d1829] border-l border-[rgba(255,255,255,0.08)] flex flex-col justify-between overflow-y-auto z-20 select-none">
      <div className="p-4 space-y-4">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
              Operational Intelligence
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="text-[#86948a] hover:text-white p-1 rounded hover:bg-[#1f2a3c]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Selected Road Details Card */}
        {selectedRoad && (
          <div className="glass-panel p-3 border-l-4 border-l-[#ef4444] relative space-y-2">
            <button
              onClick={onClearSelection}
              className="absolute top-2 right-2 text-[#86948a] hover:text-white"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Route size={14} className="text-[#f59e0b]" />
              <span>{selectedRoad.properties.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-[#86948a] block">Predicted Depth</span>
                <span className="text-lg font-bold data-mono text-[#ef4444]">
                  {selectedRoad.properties.predicted_depth_cm} cm
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#86948a] block">Risk Classification</span>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-1"
                  style={{
                    backgroundColor: `${selectedRoad.properties.risk_color}25`,
                    color: selectedRoad.properties.risk_color
                  }}
                >
                  {selectedRoad.properties.risk_level}
                </span>
              </div>
            </div>
            {(() => {
              const attributions = selectedRoad.properties.feature_attributions || {};
              const rainRaw = attributions['rainfall_intensity_mmh'] ?? 72.3;
              const slopeRaw = (attributions['depression_depth_m'] ?? 0) + (attributions['road_slope_percent'] ?? 0) || 12.4;
              const surchargeRaw = attributions['upstream_node_surcharge_m3s'] ?? 11.0;
              const totalRaw = (rainRaw + slopeRaw + surchargeRaw) || 100;
              const rainPct = Math.min(100, Math.max(0, Math.round((rainRaw / totalRaw) * 100)));
              const slopePct = Math.min(100, Math.max(0, Math.round((slopeRaw / totalRaw) * 100)));
              const surchargePct = Math.min(100, Math.max(0, 100 - rainPct - slopePct));
              const elevationDisplay = selectedRoad.properties.elevation_amsl != null
                ? `${selectedRoad.properties.elevation_amsl} m AMSL`
                : `${selectedRoad.properties.elevation_m} m`;
              const primaryCause = selectedRoad.properties.risk_primary_cause;

              return (
                <>
                  <div className="text-[11px] text-[#86948a] pt-1">
                    <span>Elevation: <strong className="text-white font-mono">{elevationDisplay}</strong></span>
                    <span className="block mt-0.5 text-[10px]">
                      Passable: {selectedRoad.properties.passable_vehicle_classes.join(', ') || 'None (Closed)'}
                    </span>
                  </div>

                  {/* Highlighted Primary Cause Narrative Banner */}
                  {primaryCause && (
                    <div className="p-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/25 text-[11px] text-[#f59e0b] flex items-start gap-1.5 mt-1.5">
                      <Sparkles size={13} className="shrink-0 mt-0.5 text-[#f59e0b]" />
                      <div className="leading-tight">
                        <span className="font-bold text-white uppercase text-[10px] block mb-0.5">Primary Flood Driver</span>
                        <span>{primaryCause}</span>
                      </div>
                    </div>
                  )}

                  {/* Explainable ML Model Card */}
                  <div className="p-2.5 rounded-lg bg-[#081425] border border-[#1e293b] space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-[#38bdf8] font-bold">
                        <Cpu size={13} />
                        <span>{selectedRoad.properties.ml_model_used || 'Random Forest Ensemble'}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-mono font-bold text-[10px]">
                        {Math.round((selectedRoad.properties.confidence || 0.94) * 100)}% Conf
                      </span>
                    </div>

                    <div className="text-[10px] text-[#64748b] flex items-center gap-1">
                      <Sparkles size={11} className="text-[#f59e0b]" />
                      <span>Coupled Hydrodynamic-ML Feature Attribution:</span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-[10px]">
                      <div>
                        <div className="flex justify-between text-[#94a3b8] mb-0.5">
                          <span>Rainfall Intensity:</span>
                          <span className="font-mono text-white font-semibold">{rainPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#38bdf8] rounded-full transition-all duration-500"
                            style={{ width: `${rainPct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#94a3b8] mb-0.5">
                          <span>Micro-Depression / Slope:</span>
                          <span className="font-mono text-white font-semibold">{slopePct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                            style={{ width: `${slopePct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#94a3b8] mb-0.5">
                          <span>Drainage Manhole Surcharge:</span>
                          <span className="font-mono text-white font-semibold">{surchargePct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#ef4444] rounded-full transition-all duration-500"
                            style={{ width: `${surchargePct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            <button
              onClick={() => onFindRouteForRoad(selectedRoad)}
              className="w-full btn-primary text-xs justify-center mt-2 py-1.5"
            >
              <Navigation size={13} />
              Calculate Avoidance Route
            </button>
          </div>
        )}

        {/* Selected Drainage Node Details Card */}
        {selectedNode && (
          <div className="glass-panel p-3 border-l-4 border-l-[#10b981] relative space-y-2">
            <button
              onClick={onClearSelection}
              className="absolute top-2 right-2 text-[#86948a] hover:text-white"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <GitCommit size={14} className="text-[#10b981]" />
              <span>Drainage Node: {selectedNode.node_code}</span>
            </div>
            <div className="text-[11px] text-[#86948a]">
              Type: <span className="text-white capitalize">{selectedNode.node_type}</span> | Elev: {selectedNode.ground_elev_m} m
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-[#86948a] block">Predicted Inflow</span>
                <span className="font-bold data-mono text-white">{selectedNode.predicted_inflow_m3s} m³/s</span>
              </div>
              <div>
                <span className="text-[10px] text-[#86948a] block">Stress Ratio</span>
                <span className={`font-bold data-mono ${selectedNode.stress_ratio > 1.1 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                  {selectedNode.stress_ratio}x
                </span>
              </div>
            </div>

            {/* Strict Notice Rule */}
            <div className="p-2 rounded bg-[#081425] text-[10px] text-[#86948a] border border-[rgba(255,255,255,0.06)] flex items-start gap-1.5 mt-1">
              <Info size={13} className="text-[#f59e0b] shrink-0 mt-0.5" />
              <span>Predicted hydraulic stress detected. Physical inspection needed to confirm blockage condition.</span>
            </div>

            <button
              onClick={() => onCreateTaskForNode(selectedNode)}
              className="w-full btn-secondary text-xs justify-center mt-2 py-1.5"
            >
              <Wrench size={13} />
              Create Inspection Task
            </button>
          </div>
        )}

        {/* Active Early Warning Alerts Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#86948a]">
            <span>Active Early Warnings</span>
            <span className="px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] text-[10px]">
              {alerts.filter(a => a.status !== 'RESOLVED').length} Active
            </span>
          </div>

          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#86948a] glass-panel">
                No active flood alerts. Nominal conditions.
              </div>
            ) : (
              alerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.alert_id}
                    className={`p-3 rounded border transition-all ${
                      isCritical
                        ? 'bg-[#ef4444]/10 border-[#ef4444]/30'
                        : 'bg-[#152031] border-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isCritical ? 'bg-[#ef4444] text-white' : 'bg-[#f59e0b] text-[#2a1700]'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-[#86948a]">{alert.status}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1.5 leading-snug">{alert.title}</h4>
                    <p className="text-[11px] text-[#86948a] mt-1 leading-relaxed">{alert.message}</p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => onOpenSmsModal ? onOpenSmsModal(alert) : undefined}
                        className="flex items-center gap-1 py-1 px-2.5 rounded bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444] hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                      >
                        <Send size={11} />
                        SMS Alert
                      </button>
                      {alert.status === 'GENERATED' && (
                        <button
                          onClick={() => onAcknowledgeAlert(alert.alert_id)}
                          className="btn-primary text-xs py-1 px-2.5 text-[11px]"
                        >
                          <CheckCircle size={12} />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Model Confidence Footer */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[#081425] text-[10px] text-[#86948a]">
        <div>Coupled 1D-2D Model Latency: <span className="text-white font-mono font-semibold">1.4s</span></div>
        <div>Inundation Confidence: <span className="text-[#10b981] font-mono font-semibold">89.2%</span></div>
      </div>
    </aside>
  );
};
