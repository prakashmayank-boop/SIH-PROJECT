import React, { useState } from 'react';
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
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openRoutingModal: () => void;
  openReportModal: () => void;
  openWhatIfSimulator?: () => void;
  openWhatIfModal?: () => void;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openRoutingModal,
  openReportModal,
  openWhatIfSimulator,
  openWhatIfModal,
  unreadAlertCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleWhatIfClick = openWhatIfSimulator || openWhatIfModal || (() => {});

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, color: '#10b981' },
    { id: 'map', label: 'Interactive GIS', icon: MapIcon, color: '#38bdf8' },
    { id: 'drainage', label: 'Drainage Network', icon: GitFork, color: '#38bdf8' },
    { id: 'forecast', label: '0–3h Nowcasting', icon: CloudRain, color: '#38bdf8' },
    { id: 'alerts', label: 'Early Warnings', icon: Bell, color: '#ef4444', badge: unreadAlertCount },
    { id: 'tasks', label: 'Field Dispatches', icon: ClipboardList, color: '#10b981' },
    { id: 'sensors', label: 'IoT Telemetry', icon: Radio, color: '#a78bfa' },
    { id: 'history', label: 'Event Replay', icon: History, color: '#f59e0b' },
    { id: 'settings', label: 'Config & Thresholds', icon: Settings, color: '#86948a' },
  ];

  const sidebarWidth = isExpanded ? 240 : 64;

  return (
    <aside
      style={{ width: sidebarWidth, minWidth: sidebarWidth, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      className="h-screen bg-[#0d1829] border-r border-[rgba(255,255,255,0.07)] flex flex-col justify-between select-none z-30 overflow-hidden relative"
    >
      {/* Toggle Expand */}
      <button
        onClick={() => setIsExpanded(p => !p)}
        style={{ right: isExpanded ? 10 : '50%', transform: isExpanded ? 'none' : 'translateX(50%)' }}
        className="absolute top-[56px] z-10 w-5 h-5 rounded-full bg-[#1e293b] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#86948a] hover:text-white transition-all hover:bg-[#2a3548]"
      >
        <ChevronRight size={11} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
      </button>

      <div>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[rgba(255,255,255,0.07)] gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
            <ShieldAlert size={18} className="animate-pulse" />
          </div>
          {isExpanded && (
            <div className="whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-sm text-white">UFIS</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                  SIH 2026
                </span>
              </div>
              <p className="text-[10px] text-[#86948a] font-medium mt-0">Urban Flood Nowcasting</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-2.5 py-3 space-y-1.5 border-b border-[rgba(255,255,255,0.06)]">
          <button
            onClick={openRoutingModal}
            title="Find Lowest-Risk Route"
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 border border-[#10b981]/30 transition-all font-semibold text-xs overflow-hidden"
          >
            <Navigation size={16} className="flex-shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Find Safe Route</span>}
          </button>
          <button
            onClick={handleWhatIfClick}
            title="What-If Simulator"
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border border-[#f59e0b]/30 transition-all font-semibold text-xs overflow-hidden"
          >
            <FlaskConical size={16} className="flex-shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">What-If Sim</span>}
          </button>
          <button
            onClick={openReportModal}
            title="Report Flooding"
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[#86948a] hover:bg-[#1e293b] hover:text-white transition-all font-medium text-xs overflow-hidden"
          >
            <AlertTriangle size={16} className="flex-shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Report Flooding</span>}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="px-2.5 py-3 space-y-0.5">
          {!isExpanded && (
            <div className="px-1 py-1 text-[9px] font-bold uppercase tracking-widest text-[#3a4a5c] text-center mb-1">
              NAV
            </div>
          )}
          {isExpanded && (
            <div className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#3a4a5c]">
              Operational Views
            </div>
          )}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group ${
                  isActive
                    ? 'text-white'
                    : 'text-[#d8e3fb]/60 hover:text-white hover:bg-[#1e293b]/60'
                }`}
                style={isActive ? { backgroundColor: `${item.color}18`, borderLeft: `2px solid ${item.color}` } : {}}
              >
                <Icon
                  size={17}
                  className="flex-shrink-0"
                  style={{ color: isActive ? item.color : undefined }}
                />
                {isExpanded && (
                  <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                )}
                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#ef4444] text-white ${isExpanded ? '' : 'absolute -top-0.5 -right-0.5'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className={`p-3 border-t border-[rgba(255,255,255,0.07)] bg-[#081425]/80 overflow-hidden ${isExpanded ? '' : 'flex justify-center'}`}>
        {isExpanded ? (
          <div className="text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">Zone</span>
              <span className="text-[#4edea3] font-semibold">Ward 151, BLR</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">Role</span>
              <span className="text-white font-medium">Control Room</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="pulse-indicator-nominal" />
            <span className="text-[9px] text-[#4edea3] font-bold">LIVE</span>
          </div>
        )}
      </div>
    </aside>
  );
};
