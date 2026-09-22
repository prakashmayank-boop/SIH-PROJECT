import React from 'react';
import { Bell, RotateCw, SlidersHorizontal, LogOut, User, Waves, ChevronDown } from 'lucide-react';
import './admin-portal.css';

interface TopBarProps {
  onScenarioChange: (scenarioId: string) => void;
  activeScenario: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  unreadAlertsCount: number;
  user: any;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onScenarioChange,
  activeScenario,
  onRefresh,
  isRefreshing,
  unreadAlertsCount,
  user,
  onOpenLogin,
  onLogout
}) => {
  return (
    <header className="ar-topbar">
      {/* Left: Live telemetry indicator */}
      <div className="ar-topbar__left">
        <div className="ar-live-pill">
          <span className="ar-pulse-dot" />
          <span className="ar-live-pill__text">Live Telemetry</span>
          <span className="ar-live-pill__sub">· Ward 151 Koramangala</span>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="ar-topbar__right">
        {/* Scenario Switcher */}
        <div className="ar-scenario-select" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SlidersHorizontal size={12} color="var(--ar-amber)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: 'var(--ar-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Scenario:
          </span>
          <select
            value={activeScenario}
            onChange={e => onScenarioChange(e.target.value)}
            style={{
              paddingRight: '18px',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          >
            <option value="monsoon_65">Heavy Monsoon (68 mm/h)</option>
            <option value="cloudburst_110">Extreme Cloudburst (115 mm/h)</option>
            <option value="light_20">Light Rain (20 mm/h)</option>
          </select>
          <ChevronDown size={11} color="var(--ar-text-muted)" style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
        </div>

        {/* Refresh button */}
        <button
          className="ar-icon-btn"
          onClick={onRefresh}
          title="Re-run Hydraulic Prediction Engine"
        >
          <RotateCw
            size={14}
            style={{ color: isRefreshing ? 'var(--ar-green)' : undefined }}
            className={isRefreshing ? 'ar-spin' : ''}
          />
        </button>

        {/* Alert Bell */}
        <div style={{ position: 'relative' }}>
          <button className="ar-icon-btn" title="Critical Alarms">
            <Bell size={14} />
          </button>
          {unreadAlertsCount > 0 && (
            <span className="ar-icon-btn__badge">{unreadAlertsCount}</span>
          )}
        </div>

        <div className="ar-divider" />

        {/* Citizen Portal Switcher */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}
          className="ar-citizen-btn"
          title="Switch to Public Citizen Flood Portal"
        >
          <Waves size={13} />
          <span>Citizen Portal</span>
        </a>

        {/* User Operator Status */}
        {user ? (
          <div className="ar-user">
            <div className="ar-avatar" title={user.email || 'Operator'}>
              {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-[11px] font-bold text-[#0F172A] leading-tight">{user.full_name || 'BBMP Operator'}</div>
              <div className="text-[9px] text-[#10B981] font-mono leading-tight uppercase font-semibold">{user.role || 'Control Room'}</div>
            </div>
            <button
              className="ar-logout-btn"
              onClick={onLogout}
              title="Sign Out of Command Session"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button className="ar-signin-btn" onClick={onOpenLogin}>
            <User size={13} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
