import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  GitFork,
  CloudRain,
  Bell,
  Navigation,
  Radio,
  ClipboardList,
  History,
  Settings,
  ShieldAlert,
  FlaskConical,
  AlertTriangle
} from 'lucide-react';
import './admin-portal.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openRoutingModal: () => void;
  openReportModal: () => void;
  openWhatIfSimulator?: () => void;
  openWhatIfModal?: () => void;
  unreadAlertCount: number;
  citizenReportsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openRoutingModal,
  openReportModal,
  openWhatIfSimulator,
  openWhatIfModal,
  unreadAlertCount,
  citizenReportsCount = 0
}) => {
  const handleWhatIfClick = openWhatIfSimulator || openWhatIfModal || (() => {});

  const navItems = [
    { id: 'dashboard',        label: 'Command Center',      icon: LayoutDashboard, color: '#10B981' },
    { id: 'map',              label: 'Interactive GIS',     icon: MapIcon,         color: '#38BDF8' },
    { id: 'citizen_reports',  label: 'Citizen Reports',     icon: AlertTriangle,   color: '#F97316', badge: citizenReportsCount, badgeClass: 'ar-nav-badge--orange' },
    { id: 'drainage',         label: 'Drainage Network',    icon: GitFork,         color: '#38BDF8' },
    { id: 'forecast',         label: '0–3h Nowcasting',     icon: CloudRain,       color: '#38BDF8' },
    { id: 'alerts',           label: 'Early Warnings',      icon: Bell,            color: '#EF4444', badge: unreadAlertCount },
    { id: 'tasks',            label: 'Field Dispatches',    icon: ClipboardList,   color: '#10B981' },
    { id: 'sensors',          label: 'IoT Telemetry',       icon: Radio,           color: '#A78BFA' },
    { id: 'history',          label: 'Event Replay',        icon: History,         color: '#F59E0B' },
    { id: 'settings',         label: 'Config & Thresholds', icon: Settings,        color: '#64748B' },
  ];

  return (
    <aside
      className="ar-sidebar"
      style={{ width: 240, minWidth: 240, maxWidth: 240 }}
    >
      {/* Permanent Stable Logo & Header */}
      <div className="ar-sidebar__logo">
        <div className="ar-logo-icon">
          <ShieldAlert size={18} />
        </div>
        <div className="ar-logo-text">
          <div className="ar-logo-name">
            <span>UFIS</span>
            <span className="ar-logo-badge">SIH 2026</span>
          </div>
          <p className="ar-logo-sub">Urban Flood Nowcasting</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ar-sidebar__actions">
        <button
          className="ar-qaction ar-qaction--green"
          onClick={openRoutingModal}
          title="Find Lowest-Risk Safe Route"
        >
          <Navigation size={15} style={{ flexShrink: 0 }} />
          <span className="ar-qaction__label">Find Safe Route</span>
        </button>

        <button
          className="ar-qaction ar-qaction--amber"
          onClick={handleWhatIfClick}
          title="What-If Scenario Simulator"
        >
          <FlaskConical size={15} style={{ flexShrink: 0 }} />
          <span className="ar-qaction__label">What-If Sim</span>
        </button>

        <button
          className="ar-qaction ar-qaction--ghost"
          onClick={openReportModal}
          title="Report Street Flooding"
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span className="ar-qaction__label">Report Flooding</span>
        </button>
      </div>

      {/* Operational Views Navigation */}
      <nav className="ar-sidebar__nav">
        <div className="ar-nav-section-label">Operational Views</div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`ar-nav-item ${isActive ? 'ar-nav-item--active' : ''}`}
              style={isActive ? {
                backgroundColor: `${item.color}18`,
                borderLeft: `3px solid ${item.color}`,
                paddingLeft: '9px',
                color: 'var(--ar-text)',
                fontWeight: 700
              } : {}}
            >
              <div className="ar-nav-item__icon">
                <Icon
                  size={17}
                  color={isActive ? item.color : undefined}
                />
              </div>

              <span className="ar-nav-item__label">{item.label}</span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`ar-nav-badge ${item.badgeClass || ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stable Footer */}
      <div className="ar-sidebar__footer">
        <div className="ar-footer-expanded">
          <div className="ar-footer-row">
            <span className="ar-footer-label">Zone</span>
            <span className="ar-footer-value">Ward 151, BLR</span>
          </div>
          <div className="ar-footer-row">
            <span className="ar-footer-label">Role</span>
            <span className="ar-footer-value--primary">Control Room</span>
          </div>
          <div className="ar-footer-row" style={{ marginTop: '4px' }}>
            <span className="ar-footer-label">Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="ar-live-dot" />
              <span className="ar-live-label">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
