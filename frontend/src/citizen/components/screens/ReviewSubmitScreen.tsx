import { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Camera,
  Layers,
  Calendar,
  Send,
  ArrowLeft
} from 'lucide-react';
import type {
  IssueCategoryId,
  SeverityLevel,
  WaterDepthCategory,
  SupportedLanguage
} from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import type { EvidenceMediaItem } from './EvidenceScreen';


interface ReviewSubmitScreenProps {
  lang: SupportedLanguage;
  category: IssueCategoryId;
  mediaItems: EvidenceMediaItem[];
  description: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  isManual: boolean;
  landmark: string;
  roadName: string;
  severity: SeverityLevel;
  waterDepth: WaterDepthCategory;
  consentConfirmed: boolean;
  onConsentChange: (confirmed: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
}

export const ReviewSubmitScreen: React.FC<ReviewSubmitScreenProps> = ({
  lang,
  category,
  mediaItems,
  description,
  latitude,
  longitude,
  accuracyM,
  isManual,
  landmark,
  roadName,
  severity,
  waterDepth,
  consentConfirmed,
  onConsentChange,
  onSubmit,
  onBack,
  onEditStep,
  isSubmitting
}) => {
  const t = TRANSLATIONS[lang];
  const [validationError, setValidationError] = useState<string | null>(null);

  const catNameKey = `cat_${category}` as keyof typeof t;
  const sevNameKey = `severity_${severity}` as keyof typeof t;
  const depthNameKey = `depth_${waterDepth}` as keyof typeof t;

  const handleFinalSubmit = () => {
    setValidationError(null);

    if (!category) {
      setValidationError('Please select an observation category.');
      return;
    }

    if (!latitude || !longitude) {
      setValidationError('Please provide a valid hazard location.');
      return;
    }

    if (!consentConfirmed) {
      setValidationError('Please check the confirmation box to confirm this report is based on your observation.');
      return;
    }

    onSubmit();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Title & Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 5 of 5</span>
          <span className="text-xs text-slate-400">Final Verification</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">{t.reviewTitle}</h2>
        <p className="text-xs text-slate-600 mt-0.5">{t.reviewSubtitle}</p>
      </div>

      {/* Structured Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Category Item */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reviewIssueCategory}
              </span>
              <span className="text-sm font-bold text-slate-900">{t[catNameKey]}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.btnEdit}
          </button>
        </div>

        {/* Location Item */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reviewLocation}
              </span>
              <p className="text-xs font-bold text-slate-900">
                {landmark || roadName ? `${landmark} ${roadName ? '— ' + roadName : ''}` : 'Pinned Location'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                {isManual ? ' (Manual map pin)' : ` (GPS ±${accuracyM}m)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.btnEdit}
          </button>
        </div>

        {/* Severity & Depth */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reviewSeverity} & Depth
              </span>
              <p className="text-xs font-bold text-slate-900">{t[sevNameKey]}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Water Depth: <span className="font-semibold">{t[depthNameKey]}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(4)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.btnEdit}
          </button>
        </div>

        {/* Photo Evidence Thumbnails */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reviewMedia} ({mediaItems.length})
              </span>
              {mediaItems.length > 0 ? (
                <div className="flex items-center gap-2 mt-2">
                  {mediaItems.map((item) => (
                    <img
                      key={item.id}
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mt-0.5">{t.noPhotosAttached}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.btnEdit}
          </button>
        </div>

        {/* Description */}
        {description && (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reviewDescription}
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                "{description}"
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 ml-2"
            >
              {t.btnEdit}
            </button>
          </div>
        )}

        {/* Observation Timestamp */}
        <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
          <Calendar size={13} />
          <span>Observation Time: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Consent Confirmation Checkbox */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => {
              onConsentChange(e.target.checked);
              setValidationError(null);
            }}
            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-xs text-slate-700 leading-relaxed font-medium">
            {t.consentCheckbox}
          </span>
        </label>
        <p className="text-[10px] text-slate-400 pl-7">
          Your report will be processed without storing sensitive private identity metadata.
        </p>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Navigation & Submit Buttons */}
      <div className="pt-3 flex items-center justify-between border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          <span>{t.btnBack}</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleFinalSubmit}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.btnSubmitting}</span>
            </>
          ) : (
            <>
              <Send size={15} />
              <span>{t.btnSubmitReport}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
