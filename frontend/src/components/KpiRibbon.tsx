import React from 'react';
import { CloudRain, AlertTriangle, Route, GitCommit, TrendingUp, Zap } from 'lucide-react';
import type { ForecastSummary } from '../types';
import './admin-portal.css';

interface KpiRibbonProps {
  summary: ForecastSummary | null;
  loading: boolean;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="ar-kpi-ribbon">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="ar-kpi-skeleton" />
        ))}
      </div>
    );
  }

  const isCritical = summary.flood_risk_index > 70;
  const riskVariant = summary.flood_risk_index > 80 ? 'red' : summary.flood_risk_index > 50 ? 'amber' : 'green';

  const metrics = [
    {
      label: 'Rainfall Rate',
      icon: CloudRain,
      variant: 'sky',
      value: summary.rainfall_mmph,
      unit: 'mm/h',
      sub: `Peak: ${summary.peak_flood_time}`,
    },
    {
      label: 'Flood Risk Index',
      icon: isCritical ? Zap : AlertTriangle,
      variant: riskVariant,
      value: summary.flood_risk_index,
      unit: '/ 100',
      sub: isCritical ? 'Critical Alert' : 'Elevated Caution',
    },
    {
      label: 'High-Risk Corridors',
      icon: Route,
      variant: 'amber',
      value: summary.critical_road_count,
      unit: 'roads',
      sub: `Max depth: ${summary.max_predicted_depth_cm} cm`,
    },
    {
      label: 'Drainage Stress',
      icon: GitCommit,
      variant: 'green',
      value: summary.surcharged_node_count,
      unit: 'nodes surcharged',
      sub: (summary as any).surcharged_node_codes?.length
        ? `Nodes: ${(summary as any).surcharged_node_codes.slice(0, 2).join(', ')}`
        : 'All nodes nominal',
    },
    {
      label: 'Model Confidence',
      icon: TrendingUp,
      variant: 'emerald',
      value: `${Math.round((summary.confidence_score ?? 0.94) * 100)}%`,
      unit: '',
      sub: summary.scenario_name || 'Hydraulic Coupled',
    },
  ];

  return (
    <div className="ar-kpi-ribbon">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className={`ar-kpi-tile ar-kpi-tile--${m.variant}`}>
            <div className="ar-kpi-icon">
              <Icon size={16} />
            </div>
            <div className="ar-kpi-content">
              <div className="ar-kpi-label">{m.label}</div>
              <div className="ar-kpi-value-row">
                <span className="ar-kpi-value">{m.value}</span>
                {m.unit ? <span className="ar-kpi-unit">{m.unit}</span> : null}
              </div>
              <div className="ar-kpi-sub">{m.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
