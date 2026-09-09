import React from 'react';
import { CloudRain, AlertTriangle, Route, GitCommit, TrendingUp, Zap } from 'lucide-react';
import type { ForecastSummary } from '../types';

interface KpiRibbonProps {
  summary: ForecastSummary | null;
  loading: boolean;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="flex items-stretch gap-0 border-b border-[rgba(255,255,255,0.07)]" style={{ height: 72 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 skeleton border-r border-[rgba(255,255,255,0.05)] last:border-r-0" />
        ))}
      </div>
    );
  }

  const isCritical = summary.flood_risk_index > 70;
  const riskColor = summary.flood_risk_index > 80 ? '#ef4444' : summary.flood_risk_index > 50 ? '#f59e0b' : '#10b981';

  const metrics = [
    {
      label: 'Rainfall Rate',
      icon: CloudRain,
      iconColor: '#38bdf8',
      accentColor: '#38bdf8',
      value: summary.rainfall_mmph,
      unit: 'mm/h',
      sub: `↑ Peak: ${summary.peak_flood_time}`,
      subColor: '#38bdf8'
    },
    {
      label: 'Flood Risk Index',
      icon: isCritical ? Zap : AlertTriangle,
      iconColor: riskColor,
      accentColor: riskColor,
      value: summary.flood_risk_index,
      unit: '/ 100',
      sub: isCritical ? '⚠ Critical alert active' : 'Elevated caution',
      subColor: riskColor
    },
    {
      label: 'High-Risk Corridors',
      icon: Route,
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
      value: summary.critical_road_count,
      unit: 'roads',
      sub: `Max depth: ${summary.max_predicted_depth_cm} cm`,
      subColor: '#86948a'
    },
    {
      label: 'Drainage Stress',
      icon: GitCommit,
      iconColor: '#10b981',
      accentColor: '#10b981',
      value: summary.surcharged_node_count,
      unit: 'nodes surcharged',
      sub: (summary as any).surcharged_node_codes?.length ? `Surcharged: ${(summary as any).surcharged_node_codes.join(', ')}` : 'All nodes nominal',
      subColor: '#4edea3'
    }
  ];

  return (
    <div
      className="flex items-stretch border-b border-[rgba(255,255,255,0.07)] bg-[#0d1829]"
      style={{ height: 72, minHeight: 72 }}
    >
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="flex-1 flex items-center gap-3 px-5 border-r border-[rgba(255,255,255,0.06)] last:border-r-0 relative overflow-hidden group hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ borderBottom: `2px solid ${m.accentColor}33` }}
          >
            {/* Accent glow on left */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 transition-all group-hover:opacity-100 opacity-60"
              style={{ backgroundColor: m.accentColor }}
            />

            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${m.accentColor}18` }}
            >
              <Icon size={16} style={{ color: m.iconColor }} />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] whitespace-nowrap">
                {m.label}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold data-mono text-white leading-none">{m.value}</span>
                <span className="text-[10px] text-[#64748b]">{m.unit}</span>
              </div>
              <div className="text-[10px] mt-0.5 truncate" style={{ color: m.subColor }}>{m.sub}</div>
            </div>

            {/* Background number watermark */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl font-black opacity-[0.04] select-none pointer-events-none data-mono"
              style={{ color: m.accentColor }}
            >
              {m.value}
            </div>
          </div>
        );
      })}

      {/* Model confidence indicator */}
      <div className="flex items-center gap-2 px-4 border-l border-[rgba(255,255,255,0.06)] flex-shrink-0 bg-[#10b981]/5">
        <TrendingUp size={14} className="text-[#10b981] flex-shrink-0" />
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">ML Confidence</div>
          <div className="text-base font-bold data-mono text-[#10b981]">
            {Math.round((summary.confidence_score ?? 0.94) * 100)}%
          </div>
          <div className="text-[9px] text-[#64748b]">{summary.scenario_name || 'Monsoon'}</div>
        </div>
      </div>
    </div>
  );
};
