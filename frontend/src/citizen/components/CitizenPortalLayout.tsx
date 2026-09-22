import { Waves, WifiOff, Home, PlusCircle, FileText, BellRing, Navigation, PhoneCall } from 'lucide-react';
import type { ScreenId, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import '../citizen-portal.css';

interface CitizenPortalLayoutProps {
  children: React.ReactNode;
  activeScreen: ScreenId;
  lang: SupportedLanguage;
  isOnline: boolean;
  onSelectScreen: (screen: ScreenId) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const CitizenPortalLayout: React.FC<CitizenPortalLayoutProps> = ({
  children,
  activeScreen,
  lang,
  isOnline,
  onSelectScreen,
  onLanguageChange
}) => {
  const t = TRANSLATIONS[lang];

  const isReporting = ['category', 'evidence', 'location', 'severity', 'review'].includes(activeScreen);

  return (
    <div className="cp-root">
      {/* ── Sticky Header ── */}
      <header className="cp-header">
        <div className="cp-header__inner">
          {/* Logo */}
          <button type="button" onClick={() => onSelectScreen('home')} className="cp-logo">
            <div className="cp-logo__icon">
              <Waves size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="cp-logo__name">UFIS</span>
                <span className="cp-logo__badge">Citizen</span>
              </div>
              <p className="cp-logo__sub">UrbanFlood Intelligence</p>
            </div>
          </button>

          {/* Controls */}
          <div className="cp-header__controls">
            {/* Network status */}
            <div
              className={`cp-status-pill ${isOnline ? 'cp-status-pill--online' : 'cp-status-pill--offline'}`}
              title={isOnline ? t.networkOnline : t.networkOffline}
            >
              {isOnline ? (
                <>
                  <span className="cp-status-dot" />
                  <span style={{ display: 'none' }} className="xs-inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={11} />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Language selector */}
            <label htmlFor="lang-select" className="sr-only">Change language</label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="cp-lang-select"
            >
              <option value="en">EN</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="hi">हिन्दी</option>
            </select>

            {/* SOS */}
            <a href="tel:112" className="cp-sos-btn" title="Call National Emergency 112">
              <PhoneCall size={12} />
              <span>112</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="cp-main cp-fade-in" key={activeScreen}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="cp-bottom-nav">
        <div className="cp-bottom-nav__inner">
          {/* Home */}
          <button
            type="button"
            onClick={() => onSelectScreen('home')}
            className={`cp-nav-tab ${activeScreen === 'home' ? 'cp-nav-tab--active' : ''}`}
          >
            <Home size={19} />
            <span>Home</span>
          </button>

          {/* Report (Primary CTA) */}
          <button
            type="button"
            onClick={() => onSelectScreen('category')}
            className={`cp-nav-tab ${
              isReporting
                ? 'cp-nav-tab--report-active'
                : 'cp-nav-tab--report'
            }`}
          >
            <PlusCircle size={19} />
            <span>Report</span>
          </button>

          {/* Safe Route */}
          <button
            type="button"
            onClick={() => onSelectScreen('safe_route')}
            className={`cp-nav-tab ${activeScreen === 'safe_route' ? 'cp-nav-tab--active' : ''}`}
          >
            <Navigation size={19} />
            <span>Safe Route</span>
          </button>

          {/* My Reports */}
          <button
            type="button"
            onClick={() => onSelectScreen('my_reports')}
            className={`cp-nav-tab ${
              activeScreen === 'my_reports' || activeScreen === 'report_details'
                ? 'cp-nav-tab--active'
                : ''
            }`}
          >
            <FileText size={19} />
            <span>My Reports</span>
          </button>

          {/* Warnings */}
          <button
            type="button"
            onClick={() => onSelectScreen('nearby_warnings')}
            className={`cp-nav-tab ${activeScreen === 'nearby_warnings' ? 'cp-nav-tab--active' : ''}`}
          >
            <BellRing size={19} />
            <span>Warnings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
