import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { KpiRibbon } from './components/KpiRibbon';
import { MapGIS } from './components/MapGIS';
import { TimeSlider } from './components/TimeSlider';
import { InspectorPanel } from './components/InspectorPanel';
import { SafeRoutingModal } from './components/SafeRoutingModal';
import { TaskModal } from './components/TaskModal';
import { ReportFloodModal } from './components/ReportFloodModal';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { SmsBroadcastModal } from './components/SmsBroadcastModal';
import { ToastProvider, useToast } from './components/Toast';
import { TabViews } from './components/Views';
import { apiService } from './services/api';
import './components/admin-portal.css';
import type {
  HorizonStep,
  RoadFeature,
  DrainageNode,
  DrainageEdge,
  ForecastSummary,
  AlertItem,
  DispatchTaskItem,
  SafeRouteResult,
  FloodReportItem
} from './types';
import { AlertCircle, RotateCcw } from 'lucide-react';

const UFISDashboard: React.FC = () => {
  const { addToast } = useToast();

  // Authentication State - restore from localStorage on mount (survives page refresh)
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('ufis_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentHorizon, setCurrentHorizon] = useState<HorizonStep>('NOW');
  const [activeScenario, setActiveScenario] = useState<string>('monsoon_65');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Map Size Toggle: 'full' | 'compact'
  const [mapSize, setMapSize] = useState<'full' | 'compact'>('full');

  // Data States
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [roads, setRoads] = useState<RoadFeature[]>([]);
  const [nodes, setNodes] = useState<DrainageNode[]>([]);
  const [edges, setEdges] = useState<DrainageEdge[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tasks, setTasks] = useState<DispatchTaskItem[]>([]);
  const [activeRoute, setActiveRoute] = useState<SafeRouteResult | null>(null);
  const [floodReports, setFloodReports] = useState<FloodReportItem[]>([]);

  // Selection & Inspector States
  const [selectedRoad, setSelectedRoad] = useState<RoadFeature | null>(null);
  const [selectedNode, setSelectedNode] = useState<DrainageNode | null>(null);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState<boolean>(false);
  const [selectedAlertForSms, setSelectedAlertForSms] = useState<AlertItem | undefined>(undefined);
  const [taskTargetNode, setTaskTargetNode] = useState<DrainageNode | null>(null);

  // UI Flow States: LOADING, SUCCESS, ERROR
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Layer Visibility
  const [layerVisibility, setLayerVisibility] = useState({
    roads: true,
    drainage: true,
    nodes: true,
    sensors: true
  });

  // Fetch all live data for the given horizon
  const loadData = useCallback(async (horizon: HorizonStep, isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [sumRes, fcastRes, drainRes, alertsRes, tasksRes, reportsRes] = await Promise.all([
        apiService.getForecastSummary(horizon),
        apiService.getFloodForecast(horizon),
        apiService.getDrainageStatus(horizon),
        apiService.getAlerts(),
        apiService.getTasks(),
        apiService.getFloodReports().catch(() => [] as FloodReportItem[]) // graceful degradation
      ]);

      setSummary(sumRes);
      setRoads(fcastRes.features);
      setNodes(drainRes.nodes);
      setEdges(drainRes.edges);
      setAlerts(alertsRes);
      setTasks(tasksRes);
      setFloodReports(reportsRes);
    } catch (err: any) {
      console.error(err);
      const msg = 'Failed to connect to UFIS Prediction Engine. Please check backend status.';
      setError(msg);
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: msg
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      loadData(currentHorizon);
    }
  }, [loadData, currentHorizon, user]);

  // Horizon Progression Timeline Player
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      const sequence: HorizonStep[] = ['NOW', '+30m', '+1h', '+2h', '+3h'];
      interval = setInterval(() => {
        setCurrentHorizon(prev => {
          const idx = sequence.indexOf(prev);
          const next = sequence[(idx + 1) % sequence.length];
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Scenario Switcher
  const handleScenarioChange = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setRefreshing(true);
    try {
      await apiService.switchScenario(scenarioId);
      await loadData(currentHorizon, true);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiService.updateAlertStatus(alertId, 'ACKNOWLEDGED');
      setAlerts(prev =>
        prev.map(a => (a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
      addToast({
        type: 'success',
        title: 'Alert Acknowledged',
        message: 'Hazard notification logged by emergency control room.'
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update alert status on server.'
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.completeTask(taskId, 'Issue resolved', 'Inspection verified normal hydraulic throughput.');
      setTasks(prev => prev.filter(t => t.task_id !== taskId));
      addToast({
        type: 'success',
        title: 'Task Completed',
        message: 'Field crew task completed and removed from active operations queue.'
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Task Update Failed',
        message: 'Could not complete task on server.'
      });
    }
  };

  const handleCompleteReport = async (reportId: string) => {
    try {
      await apiService.completeFloodReport(reportId);
      setFloodReports(prev => prev.filter(r => r.report_id !== reportId));
      addToast({
        type: 'success',
        title: 'Report Completed',
        message: 'Citizen incident resolved and removed from live observations.'
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not mark report as completed.'
      });
    }
  };

  const handleSelectRoad = (road: RoadFeature) => {
    setSelectedRoad(road);
    setSelectedNode(null);
    setIsInspectorCollapsed(false);
  };

  const handleSelectNode = (node: DrainageNode) => {
    setSelectedNode(node);
    setSelectedRoad(null);
    setIsInspectorCollapsed(false);
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'GENERATED').length;

  // Gated Authentication Screen - Rendered after all hooks have executed
  if (!user) {
    return <LoginPage onLoginSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  // Whether to show the inspector panel: hide in full GIS Workbench mode
  const showInspector = activeTab === 'dashboard' || (!!selectedRoad || !!selectedNode);
  const isGisWorkbench = activeTab === 'map';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--ar-bg)] text-[var(--ar-text)] ar-root">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openRoutingModal={() => setIsRoutingModalOpen(true)}
        openReportModal={() => setIsReportModalOpen(true)}
        openWhatIfSimulator={() => setIsWhatIfModalOpen(true)}
        unreadAlertCount={unreadAlertsCount}
        citizenReportsCount={floodReports.length}
      />

      {/* 2. Main Dashboard & Map Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <TopBar
          activeScenario={activeScenario}
          onScenarioChange={handleScenarioChange}
          onRefresh={() => {
            setRefreshing(true);
            loadData(currentHorizon, true);
          }}
          isRefreshing={refreshing}
          unreadAlertsCount={unreadAlertsCount}
          user={user}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => {
            localStorage.removeItem('ufis_token');
            localStorage.removeItem('ufis_user');
            setUser(null);
          }}
        />

        {/* Global Error State with Retry Button */}
        {error && (
          <div className="p-3 bg-[#ef4444]/10 border-b border-[#ef4444]/30 flex items-center justify-between px-6 text-xs text-[#dc2626]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#dc2626]" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={() => loadData(currentHorizon)}
              className="btn-primary text-xs py-1 px-3"
            >
              <RotateCcw size={12} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Top Metric Ribbon (Shown on Command Center view only to maximize Web GIS canvas) */}
        {activeTab === 'dashboard' && (
          <KpiRibbon summary={summary} loading={loading && !summary} />
        )}

        {/* Core View Area */}
        <div className="flex-1 relative flex overflow-hidden">
          {activeTab === 'dashboard' || isGisWorkbench ? (
            // Map & GIS area — flex-col when compact
            <div className={`relative flex-1 flex flex-col h-full overflow-hidden`}>
              {/* Map container — full height in 'full' mode, 380px in 'compact' */}
              <div
                className="relative w-full flex-shrink-0 transition-all duration-300"
                style={{ height: mapSize === 'compact' ? '380px' : '100%', flex: mapSize === 'compact' ? 'none' : '1' }}
              >
                <MapGIS
                  roads={roads}
                  nodes={nodes}
                  edges={edges}
                  activeRoute={activeRoute}
                  floodReports={floodReports}
                  onSelectRoad={handleSelectRoad}
                  onSelectNode={handleSelectNode}
                  onClearRoute={() => setActiveRoute(null)}
                  layerVisibility={layerVisibility}
                  setLayerVisibility={setLayerVisibility}
                  isFullGisMode={isGisWorkbench}
                  mapSize={mapSize}
                  onToggleMapSize={() => setMapSize(prev => prev === 'full' ? 'compact' : 'full')}
                />

                {/* Floating Time Scrubber */}
                <TimeSlider
                  currentHorizon={currentHorizon}
                  onChangeHorizon={setCurrentHorizon}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(prev => !prev)}
                />

                {/* Back to Dashboard Button — only shown in full GIS / map tab */}
                {isGisWorkbench && (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      zIndex: 1001,
                      background: 'rgba(255, 255, 255, 0.96)',
                      border: '1px solid var(--ar-border-2)',
                      color: 'var(--ar-green)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 16px rgba(15,23,42,0.1)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                    Back to Dashboard
                  </button>
                )}
              </div>

              {/* Compact Mode: Hydrodynamic Summary table below the map */}
              {mapSize === 'compact' && summary && (
                <div className="flex-1 overflow-y-auto bg-[var(--ar-surface)] border-t border-[var(--ar-border)] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ar-text-muted)] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--ar-green)] animate-pulse inline-block" />
                    Hydrodynamic Spatial Summary — {summary.horizon}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Flood Risk Index', value: `${summary.flood_risk_index}/100`, color: summary.flood_risk_index > 70 ? '#dc2626' : summary.flood_risk_index > 40 ? '#d97706' : '#059669' },
                      { label: 'Peak Depth', value: `${summary.max_predicted_depth_cm} cm`, color: '#0284c7' },
                      { label: 'Critical Roads', value: `${summary.critical_road_count}`, color: '#d97706' },
                      { label: 'Surcharged Nodes', value: `${summary.surcharged_node_count}`, color: '#7c3aed' },
                      { label: 'Rainfall', value: `${summary.rainfall_mmph} mm/h`, color: '#0284c7' },
                      { label: 'Highest Risk Area', value: summary.highest_risk_area, color: '#dc2626' },
                      { label: 'Peak Flood Time', value: summary.peak_flood_time, color: '#d97706' },
                      { label: 'Confidence', value: `${Math.round(summary.confidence_score * 100)}%`, color: '#059669' },
                    ].map(item => (
                      <div key={item.label} className="ar-card p-3">
                        <div className="text-[10px] text-[var(--ar-text-muted)] uppercase tracking-wider mb-1 font-bold">{item.label}</div>
                        <div className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Flood incident reports summary */}
                  {floodReports.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#d97706] mb-2 flex items-center gap-2">
                        <AlertCircle size={12} /> Live Citizen Reports ({floodReports.length})
                      </div>
                      <div className="space-y-1.5">
                        {floodReports.slice(0, 5).map(r => (
                          <div key={r.report_id} className="ar-card px-3 py-2 flex items-center justify-between gap-4 text-[11px]">
                            <span className="text-[var(--ar-text)] font-medium truncate">{r.description}</span>
                            <span className={`font-bold shrink-0 ${
                              r.severity === 'CRITICAL' ? 'text-[#dc2626]'
                              : r.severity === 'HIGH' ? 'text-[#d97706]'
                              : 'text-[#059669]'
                            }`}>{r.severity}</span>
                            <span className="text-[var(--ar-text-muted)] font-mono shrink-0">{r.depth_cm}cm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <TabViews
              activeTab={activeTab}
              nodes={nodes}
              edges={edges}
              tasks={tasks}
              currentHorizon={currentHorizon}
              onCompleteTask={handleCompleteTask}
              onSelectNode={handleSelectNode}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              floodReports={floodReports}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onDispatchTaskFromReport={(report) => {
                setTaskTargetNode({
                  node_id: `citizen-${report.report_id}`,
                  node_code: `CITIZEN-${report.report_id.slice(0, 6)}`,
                  node_type: 'road_drain',
                  coordinates: [report.coordinates[0], report.coordinates[1]],
                  ground_elev_m: 892.0,
                  predicted_inflow_m3s: 1.2,
                  inlet_capacity_m3s: 2.0,
                  predicted_overflow_m3s: 0.4,
                  stress_ratio: 1.25,
                  status: report.severity === 'CRITICAL' ? 'CRITICAL' : 'OVERLOADED',
                  confidence: 0.95
                });
                setIsTaskModalOpen(true);
              }}
              onSelectReportOnMap={() => {
                setActiveTab('map');
              }}
              onCompleteReport={handleCompleteReport}
            />
          )}

          {/* 3. Right Collapsible Inspector Panel
              — Hidden in GIS Workbench mode to give map 100% width */}
          {!isGisWorkbench && showInspector && (
            <InspectorPanel
              alerts={alerts}
              selectedRoad={selectedRoad}
              selectedNode={selectedNode}
              onClearSelection={() => {
                setSelectedRoad(null);
                setSelectedNode(null);
              }}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onCreateTaskForNode={node => {
                setTaskTargetNode(node);
                setIsTaskModalOpen(true);
              }}
              onFindRouteForRoad={_road => {
                setIsRoutingModalOpen(true);
              }}
              onOpenSmsModal={(alert) => {
                setSelectedAlertForSms(alert);
                setIsSmsModalOpen(true);
              }}
              isCollapsed={isInspectorCollapsed}
              onToggleCollapse={() => setIsInspectorCollapsed(prev => !prev)}
            />
          )}
        </div>
      </div>

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Dynamic Flood-Aware Routing Modal */}
      <SafeRoutingModal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        onApplyRoute={route => {
          setActiveRoute(route);
          setActiveTab('dashboard');
        }}
        currentHorizon={currentHorizon}
      />

      {/* Field Inspection Dispatch Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        targetNode={taskTargetNode}
        onTaskCreated={() => {
          addToast({
            type: 'success',
            title: 'Task Dispatched',
            message: `Field crew en route to inspect ${taskTargetNode?.node_code || 'drainage asset'}.`
          });
          loadData(currentHorizon, true);
        }}
      />

      {/* Citizen / Officer Flood Report Modal */}
      <ReportFloodModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={() => {
          addToast({
            type: 'info',
            title: 'Report Submitted',
            message: 'Street flooding report ingested into live nowcast engine.'
          });
          loadData(currentHorizon, true);
        }}
      />

      {/* What-If Scenario Simulator */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        currentHorizon={currentHorizon}
        onSimulationApplied={() => {
          addToast({
            type: 'info',
            title: 'Simulation Applied',
            message: 'Live GIS map updated with simulated precipitation parameters.'
          });
          setRefreshing(true);
          loadData(currentHorizon, true);
        }}
      />

      {/* Emergency SMS Broadcast Modal */}
      <SmsBroadcastModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        alert={selectedAlertForSms}
        onSmsSent={() => {
          addToast({
            type: 'success',
            title: 'SMS Dispatched',
            message: 'Emergency SMS notification dispatched to carrier gateway.'
          });
        }}
      />
    </div>
  );
};

import { CitizenApp } from './citizen/CitizenApp';
import { LandingPage } from './components/LandingPage';

export const App: React.FC = () => {
  const getInitialMode = (): 'landing' | 'citizen' | 'control_room' => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (h === '#control-room' || h === '#admin' || s.includes('mode=control-room') || s.includes('mode=admin')) {
        return 'control_room';
      }
      if (h === '#citizen' || s.includes('mode=citizen')) {
        return 'citizen';
      }
    }
    return 'landing';
  };

  const [viewMode, setViewMode] = useState<'landing' | 'citizen' | 'control_room'>(getInitialMode);

  useEffect(() => {
    const handleHashChange = () => {
      setViewMode(getInitialMode());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (viewMode === 'landing') {
      document.body.classList.add('landing-page-body');
      document.body.classList.remove('citizen-portal-body');
    } else if (viewMode === 'citizen') {
      document.body.classList.add('citizen-portal-body');
      document.body.classList.remove('landing-page-body');
    } else {
      document.body.classList.remove('landing-page-body', 'citizen-portal-body');
    }
  }, [viewMode]);

  const handleSelectPortal = (portal: 'citizen' | 'admin') => {
    if (portal === 'citizen') {
      window.location.hash = '#citizen';
      setViewMode('citizen');
    } else {
      window.location.hash = '#control-room';
      setViewMode('control_room');
    }
  };

  if (viewMode === 'landing') {
    return <LandingPage onSelectPortal={handleSelectPortal} />;
  }

  if (viewMode === 'citizen') {
    return <CitizenApp />;
  }

  return (
    <ToastProvider>
      <UFISDashboard />
    </ToastProvider>
  );
};

export const AppWithProviders = App;
export default App;

