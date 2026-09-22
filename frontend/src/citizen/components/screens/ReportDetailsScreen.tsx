import { useState } from 'react';
import {
  MapPin,
  Calendar,
  RotateCcw,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import type { CitizenReport, SupportedLanguage } from '../../types';

import { TRANSLATIONS } from '../../i18n/translations';
import { citizenApiService } from '../../services/citizenApi';

interface ReportDetailsScreenProps {
  lang: SupportedLanguage;
  report: CitizenReport;
  onBack: () => void;
  onReportUpdated: (updated: CitizenReport) => void;
}

export const ReportDetailsScreen: React.FC<ReportDetailsScreenProps> = ({
  lang,
  report,
  onBack,
  onReportUpdated
}) => {
  const t = TRANSLATIONS[lang];

  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState<boolean>(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const catNameKey = `cat_${report.category}` as keyof typeof t;
  const statusKey = `status_${report.status}` as keyof typeof t;
  const sevNameKey = `severity_${report.severity}` as keyof typeof t;
  const depthNameKey = `depth_${report.water_depth_category}` as keyof typeof t;

  const handleConfirmReopen = async () => {
    if (!reopenReason.trim()) {
      setReopenError('Please provide a reason why this hazard remains unresolved.');
      return;
    }

    setIsSubmittingReopen(true);
    setReopenError(null);
    try {
      const updated = await citizenApiService.reopenReport(report.public_ticket_id, reopenReason);
      onReportUpdated(updated);
      setIsReopenModalOpen(false);
      setReopenReason('');
    } catch (err) {
      console.error('Reopen error', err);
      setReopenError('Failed to reopen report. Please check your connection.');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Bar with Back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>

        {report.is_demo && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-extrabold tracking-wider">
            <Sparkles size={11} />
            <span>DEMO / SIMULATED</span>
          </span>
        )}
      </div>

      {/* Ticket Overview Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Public Ticket
            </span>
            <span className="text-lg font-mono font-extrabold text-blue-700">
              {report.public_ticket_id}
            </span>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            {t[statusKey] || report.status}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900">
          {t[catNameKey] || report.category}
        </h2>

        {/* Location & Time Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{report.landmark} ({report.road_name})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>Reported {new Date(report.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Observation Description */}
        {report.description && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 italic">
            "{report.description}"
          </div>
        )}

        {/* Severity & Water Depth Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
            {t[sevNameKey] || report.severity}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
            Depth: {t[depthNameKey] || report.water_depth_category}
          </span>
        </div>
      </div>

      {/* Photo Evidence Grid */}
      {report.media && report.media.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Photo Evidence ({report.media.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {report.media.map((m) => (
              <div key={m.id} className="rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-2xs">
                <img
                  src={m.preview_url}
                  alt={m.file_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Status Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {t.timelineTitle}
        </h3>
        <div className="space-y-4 relative pl-4 border-l-2 border-blue-200 ml-2">
          {report.status_history.map((step, idx) => (
            <div key={idx} className="relative space-y-0.5">
              <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{step.label}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {step.note && (
                <p className="text-xs text-slate-500 leading-relaxed">{step.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Public Maintenance Updates */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {t.publicUpdatesTitle}
        </h3>
        {report.public_updates.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            {t.noPublicUpdatesYet}
          </p>
        ) : (
          <div className="space-y-2.5">
            {report.public_updates.map((update) => (
              <div key={update.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-900">{update.author_role}</span>
                  <span className="text-slate-400">
                    {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{update.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reopen Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsReopenModalOpen(true)}
          className="w-full py-3 rounded-xl border border-orange-300 hover:bg-orange-50 bg-white text-orange-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
        >
          <RotateCcw size={15} />
          <span>{t.btnReopenReport}</span>
        </button>
      </div>

      {/* Reopen Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.reopenModalTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.reopenModalPrompt}</p>
            </div>

            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g., Silt removed but manhole choked again after the evening downpour..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl p-3 text-xs text-slate-800 outline-none resize-none"
            />

            {reopenError && (
              <p className="text-xs text-red-600 font-medium">{reopenError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                {t.btnCancel}
              </button>
              <button
                type="button"
                disabled={isSubmittingReopen}
                onClick={handleConfirmReopen}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                {isSubmittingReopen ? 'Reopening...' : t.btnConfirmReopen}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
