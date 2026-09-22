import React from 'react';
import {
  AlertTriangle,
  PlusCircle,
  FileText,
  BellRing,
  Navigation,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import type { SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface CitizenHomeScreenProps {
  lang: SupportedLanguage;
  onStartReport: () => void;
  onOpenMyReports: () => void;
  onOpenWarnings: () => void;
  onOpenSafeRoute: () => void;
  onOpenHelpSafety: () => void;
  hasSavedDraft?: boolean;
  onResumeDraft?: () => void;
}

export const CitizenHomeScreen: React.FC<CitizenHomeScreenProps> = ({
  lang,
  onStartReport,
  onOpenMyReports,
  onOpenWarnings,
  onOpenSafeRoute,
  onOpenHelpSafety,
  hasSavedDraft: _hasSavedDraft,
  onResumeDraft: _onResumeDraft
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="cp-space-y-4">

      {/* Safety Notice Banner */}
      <div className="cp-banner cp-banner--safety">
        <div className="cp-banner__icon">
          <AlertTriangle size={18} color="#DC2626" />
        </div>
        <div className="cp-banner__body">
          <p className="cp-banner__eyebrow">Civic Safety Notice</p>
          <p className="cp-banner__text">{t.safetyNoticeBanner}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>
            <PhoneCall size={13} />
            <span>{t.emergencyCall}</span>
          </div>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="cp-hero">
        {/* Chip */}
        <div className="cp-hero__chip">
          <ShieldCheck size={13} />
          <span>UFIS Civic Observation Layer</span>
        </div>

        {/* Title */}
        <h1 className="cp-hero__title">{t.homeTitle}</h1>
        <p className="cp-hero__subtitle">{t.homeSubtitle}</p>

        {/* Risk indicator */}
        <div className="cp-hero__risk">
          <span className="cp-hero__risk-dot" />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
            Radar live • Real-time flood intelligence active
          </span>
        </div>

        {/* Primary CTA */}
        <button type="button" onClick={onStartReport} className="cp-report-cta">
          <PlusCircle size={20} />
          <span>{t.btnReportIssue}</span>
        </button>
      </div>

      {/* Quick Action Grid */}
      <div className="cp-actions-grid">
        {/* Safe Route */}
        <button
          type="button"
          onClick={onOpenSafeRoute}
          className="cp-action-card"
        >
          <div className="cp-action-card__icon cp-action-card__icon--blue">
            <Navigation size={20} />
          </div>
          <div className="cp-action-card__content">
            <h3 className="cp-action-card__title">{t.btnSafeRouting}</h3>
            <p className="cp-action-card__desc">Avoid flooded roads & high-water streets</p>
          </div>
        </button>

        {/* Nearby Warnings */}
        <button
          type="button"
          onClick={onOpenWarnings}
          className="cp-action-card"
        >
          <div className="cp-action-card__icon cp-action-card__icon--amber">
            <BellRing size={20} />
          </div>
          <div className="cp-action-card__content">
            <h3 className="cp-action-card__title">{t.btnNearbyWarnings}</h3>
            <p className="cp-action-card__desc">Official flood advisories in your basin</p>
          </div>
        </button>

        {/* My Reports */}
        <button
          type="button"
          onClick={onOpenMyReports}
          className="cp-action-card"
        >
          <div className="cp-action-card__icon cp-action-card__icon--green">
            <FileText size={20} />
          </div>
          <div className="cp-action-card__content">
            <h3 className="cp-action-card__title">{t.btnMyReports}</h3>
            <p className="cp-action-card__desc">Track status & municipal action</p>
          </div>
        </button>

        {/* Help & Safety */}
        <button
          type="button"
          onClick={onOpenHelpSafety}
          className="cp-action-card"
        >
          <div className="cp-action-card__icon cp-action-card__icon--purple">
            <ShieldCheck size={20} />
          </div>
          <div className="cp-action-card__content">
            <h3 className="cp-action-card__title">{t.btnHelpSafety}</h3>
            <p className="cp-action-card__desc">Emergency rules for manholes & wires</p>
          </div>
        </button>
      </div>

      {/* Civic Footer */}
      <div className="cp-civic-footer">
        <p>{t.productStatement}</p>
      </div>
    </div>
  );
};
