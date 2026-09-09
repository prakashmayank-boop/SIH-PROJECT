import React, { useState } from 'react';
import { Search, Bell, RotateCw, SlidersHorizontal, LogOut, User } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-14 bg-[#0d1829] border-b border-[rgba(255,255,255,0.07)] px-4 flex items-center justify-between z-20 flex-shrink-0">
      {/* Left: Search + Live badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111c2d] border border-[rgba(255,255,255,0.07)] text-xs text-[#86948a] w-64">
          <Search size={13} className="text-[#4a5568] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search road, manhole (e.g. MH-04)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-[#4a5568] w-full"
          />
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/25">
          <div className="pulse-indicator-nominal" />
          <span className="text-[11px] font-semibold text-[#10b981] tracking-wide uppercase">Live</span>
          <span className="text-[11px] text-[#64748b]">· Koramangala</span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Scenario Switcher */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111c2d] border border-[rgba(255,255,255,0.07)] text-xs">
          <SlidersHorizontal size={12} className="text-[#f59e0b]" />
          <span className="text-[10px] text-[#64748b]">Scenario:</span>
          <select
            value={activeScenario}
            onChange={e => onScenarioChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#d8e3fb] outline-none cursor-pointer"
          >
            <option value="monsoon_65" className="bg-[#111c2d] text-white">Heavy Monsoon (68 mm/h)</option>
            <option value="cloudburst_110" className="bg-[#111c2d] text-white">Extreme Cloudburst (115 mm/h)</option>
            <option value="light_20" className="bg-[#111c2d] text-white">Light Rain (20 mm/h)</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          title="Re-run Hydraulic Prediction"
          className="p-2 rounded-lg bg-[#111c2d] hover:bg-[#1f2a3c] text-[#86948a] hover:text-white border border-[rgba(255,255,255,0.07)] transition-all"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin text-[#10b981]' : ''} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 rounded-lg bg-[#111c2d] text-[#86948a] hover:text-white border border-[rgba(255,255,255,0.07)] transition-colors">
            <Bell size={14} />
          </button>
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadAlertsCount}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[rgba(255,255,255,0.08)]" />

        {/* User section */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] text-white font-bold text-xs flex items-center justify-center shadow">
              {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-white font-semibold text-xs leading-none">{user.full_name || 'BBMP Operator'}</div>
              <div className="text-[10px] text-[#10b981] leading-tight capitalize mt-0.5">{user.role || 'operator'}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all border border-transparent hover:border-[#ef4444]/30"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 btn-primary text-xs py-1.5 px-3 font-semibold"
          >
            <User size={13} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
