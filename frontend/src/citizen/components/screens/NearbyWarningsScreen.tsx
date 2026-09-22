import {
  BellRing,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import type { PublicWarning, SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface NearbyWarningsScreenProps {
  lang: SupportedLanguage;
  warnings: PublicWarning[];
  onBack: () => void;
}

export const NearbyWarningsScreen: React.FC<NearbyWarningsScreenProps> = ({
  lang,
  warnings,
  onBack
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="cp-space-y-4">
      {/* Screen Header */}
      <div className="cp-screen-header">
        <div>
          <h2 className="cp-screen-title">{t.warningsTitle}</h2>
          <p className="cp-screen-subtitle">{t.warningsSubtitle}</p>
        </div>
        <div className="cp-screen-icon" style={{ background: 'var(--cp-amber-light)', color: '#D97706' }}>
          <BellRing size={20} />
        </div>
      </div>

      {/* Warnings */}
      <div className="cp-space-y-3">
        {warnings.length === 0 ? (
          <div className="cp-empty-state">
            <div className="cp-empty-state__icon" style={{ background: 'var(--cp-green-light)', color: 'var(--cp-green)' }}>
              <ShieldCheck size={28} />
            </div>
            <p className="cp-empty-state__title">No Active Warnings</p>
            <p className="cp-empty-state__text">{t.noWarningsMessage}</p>
          </div>
        ) : (
          warnings.map((warn) => {
            const isCritical = warn.severity === 'CRITICAL';

            return (
              <div
                key={warn.id}
                className={`cp-warning-card ${isCritical ? 'cp-warning-card--critical' : 'cp-warning-card--warning'}`}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle
                      size={18}
                      color={isCritical ? '#DC2626' : '#D97706'}
                    />
                    <span className={`cp-warning-badge ${isCritical ? 'cp-warning-badge--critical' : 'cp-warning-badge--warning'}`}>
                      {warn.severity}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cp-text)' }}>
                      {warn.area_name}
                    </span>
                  </div>
                  {warn.is_demo && (
                    <span className="cp-demo-badge">
                      <Sparkles size={10} />
                      <span>DEMO</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--cp-text)', lineHeight: '1.4' }}>
                  {warn.title}
                </h3>

                {/* Safety Advice */}
                <div className="cp-warning-safety">
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cp-text-muted)', marginBottom: '4px' }}>
                    Public Safety Advice
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--cp-text)', lineHeight: '1.6', fontWeight: '500' }}>
                    {warn.safety_recommendation}
                  </p>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--cp-text-muted)' }}>
                    <MapPin size={13} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {warn.affected_roads.join(', ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--cp-text-muted)', flexShrink: 0 }}>
                    <Clock size={13} />
                    <span>{warn.expected_duration}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Back button */}
      <button type="button" onClick={onBack} className="cp-back-btn">
        <ArrowLeft size={15} />
        <span>{t.btnBackHome}</span>
      </button>
    </div>
  );
};
