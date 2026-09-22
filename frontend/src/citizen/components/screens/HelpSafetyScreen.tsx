import React from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Zap,
  Waves,
  Car,
  Users,
  WifiOff,
  PhoneCall,
  ArrowLeft
} from 'lucide-react';
import type { SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface HelpSafetyScreenProps {
  lang: SupportedLanguage;
  onBack: () => void;
}

export const HelpSafetyScreen: React.FC<HelpSafetyScreenProps> = ({ lang, onBack }) => {
  const t = TRANSLATIONS[lang];

  const emergencyContacts = [
    { label: 'National Emergency (Police / Fire / Rescue)', number: '112', primary: true },
    { label: 'Municipal Disaster Management', number: '1533' },
    { label: 'Electricity Hazard & Transformer', number: '1912' },
    { label: 'Ambulance & Medical Emergency', number: '108' }
  ];

  const guidelines: Array<{
    title: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
  }> = [
    {
      title: 'Open or Dislodged Manholes',
      icon: <AlertOctagon size={20} color="#DC2626" />,
      bg: '#FFF7F7',
      border: '#FECACA',
      text: 'Floodwater often lifts heavy manhole covers without warning. If you see swirling water or an open chamber, do NOT walk near it. Warn nearby pedestrians from a safe distance and report immediately.'
    },
    {
      title: 'Electrical & Transformer Hazards',
      icon: <Zap size={20} color="#D97706" />,
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: 'Never touch metal lampposts, junction boxes, or submerged wiring during waterlogging. Water is an excellent conductor of electricity. Report sparking cables immediately to 1912.'
    },
    {
      title: 'Fast-Moving Water & Flash Torrents',
      icon: <Waves size={20} color="#2563EB" />,
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: 'Just 15 cm (ankle depth) of fast-moving water can knock an adult off their feet. Do not enter rushing torrents across roads or near open stormwater drains.'
    },
    {
      title: 'Driving or Riding Through Inundation',
      icon: <Car size={20} color="#4F46E5" />,
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: 'Turn Around, Don\'t Drown! Two-wheelers easily skid into submerged open culverts. 30 cm of water can float a passenger car, stalling engines and locking doors.'
    },
    {
      title: 'Children, Elderly, and Persons with Disabilities',
      icon: <Users size={20} color="#7C3AED" />,
      bg: '#FAF5FF',
      border: '#DDD6FE',
      text: 'Keep children away from waterlogged streets and open gutters. Assist elderly neighbours in moving to upper floors or safer ground before secondary flood peaks.'
    },
    {
      title: 'Reporting during Poor Mobile Network',
      icon: <WifiOff size={20} color="#475569" />,
      bg: 'var(--cp-surface-dim)',
      border: 'var(--cp-border)',
      text: 'If cellular data drops in flooded zones, UFIS will automatically save your observation as a draft on your phone. Move to high, safe ground first — don\'t linger for signal.'
    }
  ];

  return (
    <div className="cp-space-y-4">
      {/* Screen Header */}
      <div className="cp-screen-header">
        <div>
          <h2 className="cp-screen-title">{t.helpSafetyTitle}</h2>
          <p className="cp-screen-subtitle">{t.helpSafetySubtitle}</p>
        </div>
        <div className="cp-screen-icon" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="cp-emergency-card">
        <div className="cp-emergency-card__header">
          <PhoneCall size={18} color="#FCA5A5" />
          <h3 className="cp-emergency-card__title">Emergency Helplines</h3>
        </div>
        <div className="cp-contact-grid">
          {emergencyContacts.map((contact, idx) => (
            <a key={idx} href={`tel:${contact.number}`} className="cp-contact-link">
              <span className="cp-contact-link__label">{contact.label}</span>
              <span className="cp-contact-link__num">{contact.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Safety Guidelines */}
      <div className="cp-space-y-3">
        {guidelines.map((item, idx) => (
          <div
            key={idx}
            className="cp-safety-card"
            style={{ background: item.bg, borderColor: item.border }}
          >
            <div className="cp-safety-card__header">
              <div className="cp-safety-card__icon-wrap">{item.icon}</div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cp-text)' }}>{item.title}</h4>
            </div>
            <p className="cp-safety-card__text">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Back button */}
      <button type="button" onClick={onBack} className="cp-back-btn">
        <ArrowLeft size={15} />
        <span>{t.btnBackHome}</span>
      </button>
    </div>
  );
};
