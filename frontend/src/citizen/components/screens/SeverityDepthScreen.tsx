import React from 'react';
import {
  ShieldCheck,
  Footprints,
  Car,
  Home,
  AlertOctagon,
  Zap,
  Waves,
  HelpCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import type { SeverityLevel, WaterDepthCategory, SupportedLanguage } from '../../types';

import { TRANSLATIONS } from '../../i18n/translations';

interface SeverityDepthScreenProps {
  lang: SupportedLanguage;
  severity: SeverityLevel;
  waterDepth: WaterDepthCategory;
  onSeverityChange: (sev: SeverityLevel) => void;
  onWaterDepthChange: (depth: WaterDepthCategory) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SeverityDepthScreen: React.FC<SeverityDepthScreenProps> = ({
  lang,
  severity,
  waterDepth,
  onSeverityChange,
  onWaterDepthChange,
  onNext,
  onBack
}) => {
  const t = TRANSLATIONS[lang];

  const severityOptions: Array<{
    id: SeverityLevel;
    icon: React.ReactNode;
    colorClasses: string;
    borderActive: string;
    badge: string;
  }> = [
    {
      id: 'NO_IMMEDIATE_DANGER',
      icon: <ShieldCheck size={20} className="text-emerald-600" />,
      colorClasses: 'bg-emerald-50 text-emerald-950',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-400/30',
      badge: 'Low Impact'
    },
    {
      id: 'PEDESTRIANS_AFFECTED',
      icon: <Footprints size={20} className="text-blue-600" />,
      colorClasses: 'bg-blue-50 text-blue-950',
      borderActive: 'border-blue-500 ring-2 ring-blue-400/30',
      badge: 'Moderate'
    },
    {
      id: 'VEHICLES_AFFECTED',
      icon: <Car size={20} className="text-amber-600" />,
      colorClasses: 'bg-amber-50 text-amber-950',
      borderActive: 'border-amber-500 ring-2 ring-amber-400/30',
      badge: 'Traffic Disruption'
    },
    {
      id: 'WATER_ENTERING_PROPERTY',
      icon: <Home size={20} className="text-orange-600" />,
      colorClasses: 'bg-orange-50 text-orange-950',
      borderActive: 'border-orange-500 ring-2 ring-orange-400/30',
      badge: 'Property Hazard'
    },
    {
      id: 'OPEN_MANHOLE_RISK',
      icon: <AlertOctagon size={20} className="text-red-600" />,
      colorClasses: 'bg-red-50 text-red-950',
      borderActive: 'border-red-500 ring-2 ring-red-400/30',
      badge: 'Injury Risk'
    },
    {
      id: 'ELECTRICAL_EMERGENCY',
      icon: <Zap size={20} className="text-rose-600" />,
      colorClasses: 'bg-rose-50 text-rose-950',
      borderActive: 'border-rose-500 ring-2 ring-rose-400/30',
      badge: 'Critical Emergency'
    }
  ];

  const depthOptions: Array<{
    id: WaterDepthCategory;
    icon: React.ReactNode;
    visualScaleCm: string;
  }> = [
    {
      id: 'NO_STANDING_WATER',
      icon: <span className="text-lg">☀️</span>,
      visualScaleCm: '0 cm'
    },
    {
      id: 'ANKLE_DEPTH',
      icon: <span className="text-lg">🦶</span>,
      visualScaleCm: '0 - 15 cm'
    },
    {
      id: 'KNEE_DEPTH',
      icon: <span className="text-lg">🦵</span>,
      visualScaleCm: '15 - 45 cm'
    },
    {
      id: 'ABOVE_KNEE',
      icon: <Waves size={20} className="text-blue-600" />,
      visualScaleCm: '> 45 cm'
    },
    {
      id: 'UNKNOWN',
      icon: <HelpCircle size={20} className="text-slate-500" />,
      visualScaleCm: 'Uncertain'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 4 of 5</span>
          <span className="text-xs text-slate-400">Required</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">{t.severityTitle}</h2>
        <p className="text-xs text-slate-600 mt-0.5">{t.severitySubtitle}</p>
      </div>

      {/* Severity Cards List */}
      <div className="space-y-2.5" role="radiogroup" aria-label="Severity rating">
        {severityOptions.map((opt) => {
          const isSelected = severity === opt.id;
          const nameKey = `severity_${opt.id}` as keyof typeof t;
          const descKey = `severityDesc_${opt.id}` as keyof typeof t;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSeverityChange(opt.id)}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                isSelected
                  ? `${opt.colorClasses} ${opt.borderActive}`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/80 border border-slate-200/60 shrink-0 shadow-2xs">
                  {opt.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{t[nameKey]}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-700">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{t[descKey]}</p>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Water Depth Section */}
      <div className="pt-2 space-y-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t.depthSectionTitle}
          </h3>
          <p className="text-[11px] text-slate-500">
            {t.depthSectionHint}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Water depth">
          {depthOptions.map((opt) => {
            const isSelected = waterDepth === opt.id;
            const labelKey = `depth_${opt.id}` as keyof typeof t;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onWaterDepthChange(opt.id)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-1.5 rounded-full bg-slate-100/80 mb-0.5">
                  {opt.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {t[labelKey]}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {opt.visualScaleCm}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-3 flex items-center justify-between border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          <span>{t.btnBack}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
        >
          <span>Review Report</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
