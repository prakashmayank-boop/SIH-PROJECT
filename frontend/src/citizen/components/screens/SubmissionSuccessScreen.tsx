import { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  FileText,
  PlusCircle,
  Home
} from 'lucide-react';
import type { SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface SubmissionSuccessScreenProps {
  lang: SupportedLanguage;
  ticketId: string;
  submittedAt: string;
  onViewReport: (ticketId: string) => void;
  onSubmitAnother: () => void;
  onBackHome: () => void;
}

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  lang,
  ticketId,
  submittedAt,
  onViewReport,
  onSubmitAnother,
  onBackHome
}) => {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cp-space-y-4" style={{ paddingTop: '16px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Success visual */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0 8px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--cp-green-light)',
          color: 'var(--cp-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 8px rgba(22,163,74,0.10)'
        }}>
          <CheckCircle size={38} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--cp-text)', letterSpacing: '-0.02em' }}>
          {t.successTitle}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--cp-text-muted)', lineHeight: '1.7', maxWidth: '320px' }}>
          {t.successMessage}
        </p>
      </div>

      {/* Ticket Card */}
      <div className="cp-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--cp-border)', marginBottom: '14px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cp-text-muted)', marginBottom: '4px' }}>
              {t.successTicketId}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '900', color: 'var(--cp-blue)', letterSpacing: '0.03em' }}>
              {ticketId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyTicket}
            className="cp-back-btn"
            title="Copy Ticket ID"
          >
            {copied ? <Check size={14} color="var(--cp-green)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
          <div>
            <span style={{ display: 'block', color: 'var(--cp-text-muted)', fontSize: '11px', marginBottom: '4px' }}>Status</span>
            <span className="cp-status-badge cp-status-badge--pending">
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--cp-blue)', display: 'inline-block' }} />
              Received
            </span>
          </div>
          <div>
            <span style={{ display: 'block', color: 'var(--cp-text-muted)', fontSize: '11px', marginBottom: '4px' }}>Logged At</span>
            <span style={{ fontWeight: '600', color: 'var(--cp-text)' }}>
              {new Date(submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'var(--cp-amber-light)', border: '1px solid #FDE68A', borderRadius: 'var(--cp-radius-lg)', padding: '14px 16px' }}>
        <p style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.6' }}>
          {t.successNoPromiseNote}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="cp-space-y-2">
        <button
          type="button"
          onClick={() => onViewReport(ticketId)}
          className="cp-btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: '14px' }}
        >
          <FileText size={17} />
          <span>{t.btnViewThisReport}</span>
        </button>

        <button
          type="button"
          onClick={onSubmitAnother}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '13px 24px',
            background: 'var(--cp-surface)',
            border: '1px solid var(--cp-border)',
            borderRadius: 'var(--cp-radius)',
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--cp-text)',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <PlusCircle size={17} color="var(--cp-green)" />
          <span>{t.btnSubmitAnother}</span>
        </button>

        <button
          type="button"
          onClick={onBackHome}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--cp-text-muted)',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <Home size={15} />
          <span>{t.btnBackHome}</span>
        </button>
      </div>
    </div>
  );
};
