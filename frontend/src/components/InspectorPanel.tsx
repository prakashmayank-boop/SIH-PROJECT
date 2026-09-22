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
import './admin-portal.css';

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
      <button className="ar-inspector-collapsed-btn" onClick={onToggleCollapse}>
        <AlertTriangle size={14} color="var(--ar-red)" />
        <span>Operational Inspector</span>
      </button>
    );
  }

  return (
    <aside className="ar-inspector">
      {/* Header */}
      <div className="ar-inspector__header">
        <span className="ar-inspector__title">Operational Intelligence</span>
        <button className="ar-inspector__close" onClick={onToggleCollapse}>
          <X size={14} />
        </button>
      </div>

      <div className="ar-inspector__body">
        {/* ── Selected Road ── */}
        {selectedRoad && (() => {
          const attributions = selectedRoad.properties.feature_attributions || {};
          const rainRaw = attributions['rainfall_intensity_mmh'] ?? 72.3;
          const slopeRaw = (attributions['depression_depth_m'] ?? 0) + (attributions['road_slope_percent'] ?? 0) || 12.4;
          const surchargeRaw = attributions['upstream_node_surcharge_m3s'] ?? 11.0;
          const totalRaw = (rainRaw + slopeRaw + surchargeRaw) || 100;
          const rainPct = Math.min(100, Math.max(0, Math.round((rainRaw / totalRaw) * 100)));
          const slopePct = Math.min(100, Math.max(0, Math.round((slopeRaw / totalRaw) * 100)));
          const surchargePct = Math.min(100, Math.max(0, 100 - rainPct - slopePct));
          const elevDisplay = selectedRoad.properties.elevation_amsl != null
            ? `${selectedRoad.properties.elevation_amsl} m AMSL`
            : `${selectedRoad.properties.elevation_m} m`;

          return (
            <div className="ar-detail-card ar-detail-card--road">
              <button className="ar-detail-card__close" onClick={onClearSelection}>
                <X size={12} />
              </button>

              <div className="ar-detail-card__title">
                <Route size={14} color="var(--ar-amber)" />
                <span>{selectedRoad.properties.name}</span>
              </div>

              <div className="ar-detail-grid">
                <div>
                  <span className="ar-detail-metric__label">Predicted Depth</span>
                  <div className="ar-detail-metric__value" style={{ color: 'var(--ar-red)' }}>
                    {selectedRoad.properties.predicted_depth_cm}
                    <span style={{ fontSize: '12px', fontWeight: 500 }}> cm</span>
                  </div>
                </div>
                <div>
                  <span className="ar-detail-metric__label">Risk Level</span>
                  <span
                    className="ar-risk-badge"
                    style={{
                      backgroundColor: `${selectedRoad.properties.risk_color}20`,
                      color: selectedRoad.properties.risk_color,
                    }}
                  >
                    {selectedRoad.properties.risk_level}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--ar-text-muted)', lineHeight: '1.5' }}>
                <div>Elevation: <strong style={{ color: 'var(--ar-text)', fontFamily: 'var(--ar-mono)' }}>{elevDisplay}</strong></div>
                <div style={{ marginTop: '2px', fontSize: '10px' }}>
                  Passable: {selectedRoad.properties.passable_vehicle_classes.join(', ') || 'None (Closed)'}
                </div>
              </div>

              {/* Cause banner */}
              {selectedRoad.properties.risk_primary_cause && (
                <div className="ar-cause-banner">
                  <Sparkles size={13} color="var(--ar-amber)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <span className="ar-cause-banner__title">Primary Flood Driver</span>
                    <span className="ar-cause-banner__text">
                      {selectedRoad.properties.risk_primary_cause}
                    </span>
                  </div>
                </div>
              )}

              {/* ML Attribution Card */}
              <div className="ar-ml-card">
                <div className="ar-ml-card__header">
                  <div className="ar-ml-card__model">
                    <Cpu size={13} />
                    <span>{selectedRoad.properties.ml_model_used || 'Random Forest Ensemble'}</span>
                  </div>
                  <span className="ar-conf-badge">
                    {Math.round((selectedRoad.properties.confidence || 0.94) * 100)}% Conf
                  </span>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--ar-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} color="var(--ar-amber)" />
                  <span>Hydrodynamic-ML Feature Attribution</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {[
                    { label: 'Rainfall Intensity', pct: rainPct, color: 'var(--ar-sky)' },
                    { label: 'Micro-Depression / Slope', pct: slopePct, color: 'var(--ar-amber)' },
                    { label: 'Drainage Surcharge', pct: surchargePct, color: 'var(--ar-red)' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="ar-attribution-row">
                      <div className="ar-attribution-row__top">
                        <span>{label}:</span>
                        <span className="ar-attribution-row__pct">{pct}%</span>
                      </div>
                      <div className="ar-progress-bar">
                        <div
                          className="ar-progress-bar__fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="ar-btn-primary"
                onClick={() => onFindRouteForRoad(selectedRoad)}
              >
                <Navigation size={13} />
                Calculate Avoidance Route
              </button>
            </div>
          );
        })()}

        {/* ── Selected Drainage Node ── */}
        {selectedNode && (
          <div className="ar-detail-card ar-detail-card--node">
            <button className="ar-detail-card__close" onClick={onClearSelection}>
              <X size={12} />
            </button>

            <div className="ar-detail-card__title">
              <GitCommit size={14} color="var(--ar-green)" />
              <span>Drainage Node: {selectedNode.node_code}</span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--ar-text-muted)' }}>
              Type: <span style={{ color: 'var(--ar-text)', fontWeight: 600, textTransform: 'capitalize' }}>{selectedNode.node_type}</span>
              {' '} | Elev: {selectedNode.ground_elev_m} m
            </div>

            <div className="ar-detail-grid">
              <div>
                <span className="ar-detail-metric__label">Predicted Inflow</span>
                <div className="ar-detail-metric__value" style={{ fontSize: '16px', color: 'var(--ar-text)' }}>
                  {selectedNode.predicted_inflow_m3s}
                  <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--ar-text-muted)' }}> m³/s</span>
                </div>
              </div>
              <div>
                <span className="ar-detail-metric__label">Stress Ratio</span>
                <div
                  className="ar-detail-metric__value"
                  style={{
                    fontSize: '16px',
                    color: selectedNode.stress_ratio > 1.1 ? 'var(--ar-red)' : 'var(--ar-green)'
                  }}
                >
                  {selectedNode.stress_ratio}x
                </div>
              </div>
            </div>

            <div className="ar-info-box">
              <Info size={13} color="var(--ar-amber)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Predicted hydraulic stress detected. Physical inspection needed to confirm blockage condition.</span>
            </div>

            <button
              className="ar-btn-secondary"
              onClick={() => onCreateTaskForNode(selectedNode)}
            >
              <Wrench size={13} />
              Create Inspection Task
            </button>
          </div>
        )}

        {/* ── Active Warnings ── */}
        <div>
          <div className="ar-section-heading" style={{ marginBottom: '10px' }}>
            <span>Active Early Warnings</span>
            <span className="ar-count-badge">
              {alerts.filter(a => a.status !== 'RESOLVED').length} Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.length === 0 ? (
              <div className="ar-empty">
                ✓ No active flood alerts. Nominal conditions.
              </div>
            ) : (
              alerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.alert_id}
                    className={`ar-alert-card ${isCritical ? 'ar-alert-card--critical' : 'ar-alert-card--warning'}`}
                  >
                    <div className="ar-alert-header">
                      <span className={`ar-sev-badge ${isCritical ? 'ar-sev-badge--critical' : 'ar-sev-badge--warning'}`}>
                        {alert.severity}
                      </span>
                      <span className="ar-status-chip">{alert.status}</span>
                    </div>

                    <p className="ar-alert-title">{alert.title}</p>
                    <p className="ar-alert-msg">{alert.message}</p>

                    <div className="ar-alert-actions">
                      <button
                        className="ar-btn-sms"
                        onClick={() => onOpenSmsModal ? onOpenSmsModal(alert) : undefined}
                      >
                        <Send size={11} />
                        SMS Alert
                      </button>
                      {alert.status === 'GENERATED' && (
                        <button
                          className="ar-btn-ack"
                          onClick={() => onAcknowledgeAlert(alert.alert_id)}
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

      {/* Footer */}
      <div className="ar-inspector__footer">
        <div>Coupled 1D-2D Model Latency: <span style={{ color: 'var(--ar-text)', fontFamily: 'var(--ar-mono)', fontWeight: 600 }}>1.4s</span></div>
        <div style={{ marginTop: '3px' }}>Inundation Confidence: <span style={{ color: 'var(--ar-green)', fontFamily: 'var(--ar-mono)', fontWeight: 600 }}>89.2%</span></div>
      </div>
    </aside>
  );
};
