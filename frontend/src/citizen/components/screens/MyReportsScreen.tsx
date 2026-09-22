import { useState } from 'react';
import {
  FileText,
  MapPin,
  ChevronRight,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import type { CitizenReport, ReportStatus, SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface MyReportsScreenProps {
  lang: SupportedLanguage;
  reports: CitizenReport[];
  onSelectReport: (ticketId: string) => void;
  onNewReport: () => void;
  onBack: () => void;
}

type FilterType = 'All' | 'Active' | 'Resolved' | 'Reopened';

const getStatusBadgeClass = (status: ReportStatus): string => {
  switch (status) {
    case 'RECEIVED':
    case 'SUBMITTED':
      return 'cp-status-badge cp-status-badge--pending';
    case 'UNDER_REVIEW':
    case 'ASSIGNED':
    case 'INSPECTION_IN_PROGRESS':
      return 'cp-status-badge cp-status-badge--review';
    case 'ACTION_TAKEN':
    case 'RESOLVED':
      return 'cp-status-badge cp-status-badge--verified';
    case 'REJECTED':
    case 'POSSIBLE_DUPLICATE':
      return 'cp-status-badge cp-status-badge--rejected';
    default:
      return 'cp-status-badge cp-status-badge--pending';
  }
};

const getStatusIcon = (status: ReportStatus) => {
  switch (status) {
    case 'RESOLVED':
    case 'ACTION_TAKEN':
      return <CheckCircle size={12} />;
    case 'UNDER_REVIEW':
    case 'ASSIGNED':
    case 'INSPECTION_IN_PROGRESS':
      return <Clock size={12} />;
    case 'REJECTED':
    case 'POSSIBLE_DUPLICATE':
      return <XCircle size={12} />;
    default:
      return <AlertCircle size={12} />;
  }
};

export const MyReportsScreen: React.FC<MyReportsScreenProps> = ({
  lang,
  reports,
  onSelectReport,
  onNewReport,
  onBack
}) => {
  const t = TRANSLATIONS[lang];
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Resolved') return r.status === 'RESOLVED' || r.status === 'ACTION_TAKEN';
    if (activeFilter === 'Reopened') return r.status === 'REOPENED';
    if (activeFilter === 'Active') {
      return ['RECEIVED', 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(r.status);
    }
    return true;
  });

  // Stats
  const verified = reports.filter(r => r.status === 'RESOLVED' || r.status === 'ACTION_TAKEN').length;
  const review = reports.filter(r => ['UNDER_REVIEW', 'ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(r.status)).length;
  const rejected = reports.filter(r => ['REJECTED', 'POSSIBLE_DUPLICATE'].includes(r.status)).length;

  return (
    <div className="cp-space-y-4">
      {/* Screen Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 className="cp-screen-title">{t.myReportsTitle}</h2>
          <p className="cp-screen-subtitle" style={{ marginTop: '2px' }}>{t.myReportsSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={onNewReport}
          className="cp-btn-primary"
          style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0 }}
        >
          <PlusCircle size={15} />
          <span>New</span>
        </button>
      </div>

      {/* Stats Bar */}
      {reports.length > 0 && (
        <div className="cp-stats-bar">
          <div className="cp-stat">
            <div className="cp-stat__value">{reports.length}</div>
            <div className="cp-stat__label">Total</div>
          </div>
          <div className="cp-stat cp-stat--verified">
            <div className="cp-stat__value">{verified}</div>
            <div className="cp-stat__label">Resolved</div>
          </div>
          <div className="cp-stat cp-stat--review">
            <div className="cp-stat__value">{review}</div>
            <div className="cp-stat__label">Review</div>
          </div>
          <div className="cp-stat cp-stat--rejected">
            <div className="cp-stat__value">{rejected}</div>
            <div className="cp-stat__label">Rejected</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="cp-filter-tabs">
        {(['All', 'Active', 'Resolved', 'Reopened'] as FilterType[]).map((tab) => {
          const tabKey = `filter${tab}` as keyof typeof t;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`cp-filter-tab ${activeFilter === tab ? 'cp-filter-tab--active' : ''}`}
            >
              {t[tabKey]}
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="cp-space-y-3">
        {filteredReports.length === 0 ? (
          <div className="cp-empty-state">
            <div className="cp-empty-state__icon">
              <FileText size={28} />
            </div>
            <p className="cp-empty-state__title">No Reports Here</p>
            <p className="cp-empty-state__text">{t.noReportsFound}</p>
            <button type="button" onClick={onNewReport} className="cp-btn-primary">
              <PlusCircle size={16} />
              <span>Submit Your First Report</span>
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
            const catNameKey = `cat_${report.category}` as keyof typeof t;
            const statusKey = `status_${report.status}` as keyof typeof t;
            const thumbnail = report.media && report.media.length > 0 ? report.media[0].preview_url : null;

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.public_ticket_id)}
                className="cp-report-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectReport(report.public_ticket_id)}
              >
                {/* Demo badge */}
                {report.is_demo && (
                  <div className="cp-demo-badge">
                    <Sparkles size={10} />
                    <span>DEMO REPORT</span>
                  </div>
                )}

                <div className="cp-report-card__header">
                  <div className="cp-report-card__icon">
                    <FileText size={20} />
                  </div>

                  <div className="cp-report-card__meta">
                    <div className="cp-ticket-id">{report.public_ticket_id}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <p className="cp-report-card__category">{t[catNameKey] || report.category}</p>
                      <span className={getStatusBadgeClass(report.status)}>
                        {getStatusIcon(report.status)}
                        {t[statusKey] || report.status}
                      </span>
                    </div>
                  </div>

                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="Observation"
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--cp-border)', flexShrink: 0 }}
                    />
                  ) : (
                    <ChevronRight size={18} color="var(--cp-text-muted)" style={{ flexShrink: 0, alignSelf: 'center' }} />
                  )}
                </div>

                <div className="cp-report-card__footer">
                  <div className="cp-report-card__loc">
                    <MapPin size={12} color="var(--cp-text-subtle)" />
                    <span>{report.landmark || report.road_name || 'Koramangala'}</span>
                  </div>
                  <div className="cp-report-card__time">
                    <Clock size={12} color="var(--cp-text-subtle)" />
                    <span>{new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
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
