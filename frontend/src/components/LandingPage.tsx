import React from 'react';
import {
  Shield,
  MapPin,
  Droplets,
  Activity,
  Compass,
  FileText,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Users,
  BarChart3,
  Cpu,
  Radar,
  HelpCircle,
  Clock,
  Waves
} from 'lucide-react';

interface LandingPageProps {
  onSelectPortal: (portal: 'citizen' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectPortal }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* ─── 1. TOP NAVIGATION ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F3A] via-[#123B63] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/15">
              <Waves size={22} className="text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#0B1F3A]">UFIS</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
                  v2.4 Live
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium hidden md:block">
                UrbanFlood Intelligence System
              </p>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#475569]">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#2563EB] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="hover:text-[#2563EB] transition-colors"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('portals')}
              className="hover:text-[#2563EB] transition-colors"
            >
              Portals
            </button>
            <button
              onClick={() => scrollToSection('trust')}
              className="hover:text-[#2563EB] transition-colors"
            >
              Responsible AI
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className="hover:text-[#2563EB] transition-colors"
            >
              About Kalki 2.0
            </button>
          </nav>

          {/* Right Status Pill & CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-xs text-xs font-semibold text-[#0B1F3A]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>SIH 2026 • Disaster Resilience</span>
            </div>
            <button
              onClick={() => scrollToSection('portals')}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              Launch Platform
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-28 border-b border-[#E2E8F0] bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#F6F9FC]">
        {/* Subtle decorative background contours */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
            <path d="M0,150 Q250,50 500,180 T1000,120" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6,6" />
            <path d="M0,280 Q350,220 700,320 T1000,260" stroke="#2563EB" strokeWidth="1" opacity="0.6" />
            <path d="M0,450 Q200,380 600,480 T1000,400" stroke="#0B1F3A" strokeWidth="1" strokeDasharray="8,8" opacity="0.4" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Mission Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#DBEAFE]/80 border border-[#93C5FD] text-[#1E40AF] text-xs font-bold tracking-wider uppercase">
                <Radar size={13} className="text-[#2563EB] animate-spin" style={{ animationDuration: '6s' }} />
                Smart India Hackathon 2026 • Team Kalki 2.0
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1F3A] leading-[1.15]">
                Know the flood risk{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#0284C7] to-[#38BDF8]">
                  before the water rises.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#334155] font-medium leading-relaxed">
                From rainfall intelligence to street-level action.
              </p>

              <p className="text-base text-[#64748B] leading-relaxed max-w-2xl">
                UFIS combines rainfall nowcasts, high-resolution terrain DEM, underground drainage graphs,
                IoT flow observations, and verified citizen hazard reports to deliver explainable urban flood predictions
                and coordinated municipal response over a 0–3 hour operational window.
              </p>

              {/* Feature Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                    <Clock size={14} className="text-[#2563EB]" />
                    0–3h Nowcasting
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Sub-hourly horizon</div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                    <Compass size={14} className="text-[#0284C7]" />
                    Road-Level Risk
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Passable depth cm</div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                    <MapPin size={14} className="text-[#F59E0B]" />
                    Citizen Ground
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Geotagged reports</div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                    <Shield size={14} className="text-[#16A34A]" />
                    Response Hub
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Automated dispatch</div>
                </div>
              </div>

              {/* Action Button Row */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={() => onSelectPortal('citizen')}
                  className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <MapPin size={16} />
                  Enter Citizen Portal
                </button>
                <button
                  onClick={() => onSelectPortal('admin')}
                  className="px-6 py-3.5 rounded-xl bg-[#0B1F3A] hover:bg-[#123B63] text-white font-semibold text-sm shadow-md shadow-slate-900/15 transition-all flex items-center gap-2"
                >
                  <Shield size={16} />
                  Open Admin Portal
                </button>
              </div>
            </div>

            {/* Right Column: Conceptual Model Visual Canvas */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-xl shadow-slate-900/5">
                {/* Header of Conceptual Canvas */}
                <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping" />
                    <span className="text-xs font-bold text-[#0B1F3A]">Hydrodynamic Coupling Canvas</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                    Ward 151 Koramangala
                  </span>
                </div>

                {/* Illustrated System Diagram */}
                <div className="relative bg-[#081425] rounded-xl p-5 text-white overflow-hidden min-h-[280px] flex flex-col justify-between">
                  {/* Background grid and flow vectors */}
                  <div className="absolute inset-0 opacity-15">
                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  </div>

                  {/* Simulated network layers */}
                  <div className="relative z-10 flex items-center justify-between text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1.5 bg-[#0F294D] px-2.5 py-1 rounded-md border border-white/10">
                      <Radar size={13} className="text-[#38BDF8]" />
                      <span>Rainfall: <b>65 mm/h</b></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0F294D] px-2.5 py-1 rounded-md border border-white/10">
                      <Activity size={13} className="text-[#10B981]" />
                      <span>DEM Slope: <b>0.005 S</b></span>
                    </div>
                  </div>

                  {/* Center connected flow graph illustration */}
                  <div className="relative z-10 my-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono px-2 text-[#64748B]">
                      <span>Surface Inflow</span>
                      <span className="text-[#38BDF8]">Road ➔ Inlet ➔ Conduit</span>
                      <span>Lake Outfall</span>
                    </div>
                    {/* Visual pipeline connector */}
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden flex">
                      <div className="w-1/3 bg-[#38BDF8] animate-pulse" />
                      <div className="w-1/3 bg-[#F59E0B]" />
                      <div className="w-1/3 bg-[#DC2626]" />
                    </div>
                  </div>

                  {/* Conceptual Model Output Floating Card */}
                  <div className="relative z-10 bg-[#111C2D]/95 backdrop-blur-md rounded-lg p-3.5 border border-white/15 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                        <span className="text-xs font-bold text-white">Road Segment R-104</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#DC2626]/20 text-[#F87171] border border-[#DC2626]/40">
                        Critical Inundation
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/5 rounded p-1.5">
                        <div className="text-[10px] text-[#94A3B8]">Pred. Depth</div>
                        <div className="font-bold text-[#F87171] font-mono">32 cm</div>
                      </div>
                      <div className="bg-white/5 rounded p-1.5">
                        <div className="text-[10px] text-[#94A3B8]">Lead Time</div>
                        <div className="font-bold text-white font-mono">+45 min</div>
                      </div>
                      <div className="bg-white/5 rounded p-1.5">
                        <div className="text-[10px] text-[#94A3B8]">Confidence</div>
                        <div className="font-bold text-[#10B981] font-mono">86%</div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#94A3B8]">
                      <span>Attribution: Depression + Surcharge</span>
                      <span className="text-[#38BDF8] font-bold">MH-07 Bottleneck</span>
                    </div>
                  </div>
                </div>

                {/* Explicit Conceptual Disclaimer Label */}
                <div className="mt-3 flex items-center justify-between text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284C7]">
                    <HelpCircle size={12} />
                    Conceptual system visualization
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Non-operational schematic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. TWO PORTAL ENTRY CARDS (CENTERPIECE) ──────────────────────── */}
      <section id="portals" className="py-20 lg:py-28 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
              Integrated City Resiliency Gateway
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A]">
              Choose your UFIS experience
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              One unified platform. Two coordinated approaches to protect our communities and infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* CARD A — CITIZEN PORTAL */}
            <div className="group rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border-2 border-[#DBEAFE] hover:border-[#2563EB] p-8 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <MapPin size={28} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">
                    Public Portal
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#0B1F3A] mb-3">
                  Citizen Portal
                </h3>

                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                  Report overflowing drains, blocked or open manholes, flooded roads, and other hazards with real-time GPS location and photographic evidence.
                </p>

                {/* Feature Bullets */}
                <div className="space-y-3 mb-8">
                  {[
                    'Report a flood or drainage issue in 3 clicks',
                    'Upload geo-tagged evidence photo and precise location',
                    'View nearby public flood depth warnings and road safety',
                    'Track municipal response status and verification history',
                    'Help validate and calibrate hydrodynamic flood models'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155] font-medium">
                      <CheckCircle2 size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Micro-Illustration: Smartphone Report Card */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0B1F3A] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Droplets size={14} className="text-[#0284C7]" />
                      Report #CR-408 • ST Bed Avenue
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] font-bold">
                      Report Received
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Issue: Severe drain overflow with missing grate • Verification queued
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => onSelectPortal('citizen')}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Enter Citizen Portal</span>
                  <ArrowRight size={16} />
                </button>
                <p className="text-[11px] text-center text-[#94A3B8] font-medium mt-3">
                  For residents, commuters, volunteers, and local communities
                </p>
              </div>
            </div>

            {/* CARD B — ADMIN PORTAL */}
            <div className="group rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border-2 border-[#CBD5E1] hover:border-[#0B1F3A] p-8 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Shield size={28} className="text-[#38BDF8]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0B1F3A] text-white">
                    Authorized Municipal
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#0B1F3A] mb-3">
                  Admin Portal
                </h3>

                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                  Monitor flood forecasts, drainage stress, citizen observations, alerts, response priorities, and lower predicted flood-risk routes.
                </p>

                {/* Feature Bullets */}
                <div className="space-y-3 mb-8">
                  {[
                    'View 0–3 hour nowcast predictions across street segments',
                    'Monitor road-level water depth and emergency corridor status',
                    'Analyse 1D drainage hydraulic capacity and pipe surcharge stress',
                    'Review and verify crowd-sourced citizen hazard reports',
                    'Prioritize emergency response crew dispatch and pump tasks',
                    'Calculate lowest predicted flood-risk routes for response vehicles'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155] font-medium">
                      <CheckCircle2 size={16} className="text-[#0B1F3A] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Micro-Illustration: Command HUD Card */}
                <div className="p-3.5 rounded-xl bg-[#0B1F3A] text-white shadow-xs mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-[#38BDF8]">
                      <BarChart3 size={14} />
                      Ward 151 Central Command
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#DC2626] text-white font-bold">
                      2 Critical Nodes
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    Network Load: 88.4% • Inundated: 420m • Response crews active
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => onSelectPortal('admin')}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F3A] hover:bg-[#123B63] text-white font-semibold text-sm shadow-md shadow-slate-900/15 transition-all flex items-center justify-center gap-2"
                >
                  <span>Open Admin Portal</span>
                  <ExternalLink size={16} />
                </button>
                <p className="text-[11px] text-center text-[#94A3B8] font-medium mt-3">
                  For authorized municipal engineers and emergency-response teams
                </p>
              </div>
            </div>
          </div>

          {/* Security & Governance Disclaimer Under Portal Cards */}
          <div className="mt-10 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 text-xs text-[#64748B] max-w-3xl mx-auto shadow-xs">
            <Lock size={18} className="text-[#0B1F3A] shrink-0" />
            <p>
              <strong className="text-[#0F172A]">Security Notice:</strong> Admin tools are strictly restricted to authorized municipal personnel. Citizen reports are utilized as field observations and may require municipal engineering verification before dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS SECTION ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
              Hydrodynamic Intelligence Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A]">
              From observation to action
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              A continuous, explainable loop that couples surface overland runoff with subterranean drainage pipe dynamics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow relative">
              <span className="text-3xl font-extrabold text-[#DBEAFE] font-mono">01</span>
              <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center my-4">
                <Radar size={20} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Observe</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Ingests radar precipitation nowcasts, terrain elevation (DEM), road network centerlines, drainage conduits, IoT sensors, and citizen ground reports.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow relative">
              <span className="text-3xl font-extrabold text-[#DBEAFE] font-mono">02</span>
              <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#0284C7] flex items-center justify-center my-4">
                <Cpu size={20} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Understand</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Hydrodynamic coupling models rainfall infiltration, road accumulation, inlet inflow capacities, pipe conveyance, and surcharge backwater bottlenecks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow relative">
              <span className="text-3xl font-extrabold text-[#DBEAFE] font-mono">03</span>
              <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#F59E0B] flex items-center justify-center my-4">
                <HelpCircle size={20} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Explain</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Decomposes risk into transparent attributions (e.g. 55% rainfall intensity, 25% drainage bottleneck, 20% depression depth) with calibrated confidence.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow relative">
              <span className="text-3xl font-extrabold text-[#DBEAFE] font-mono">04</span>
              <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#16A34A] flex items-center justify-center my-4">
                <Shield size={20} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Respond</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Municipal authorities deploy dewatering pumps and dispatch crews, while citizens receive neighborhood warnings and flood-aware navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CORE CAPABILITIES SECTION ─────────────────────────────────── */}
      <section id="capabilities" className="py-20 lg:py-28 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
              Operational Innovations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A]">
              Built for the last mile of flood response
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              Engineered to replace slow post-disaster recovery with proactive, explainable predictive decision-support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white text-[#2563EB] border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-xs">
                <Clock size={24} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">0–3 Hour Nowcasting</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Generates high-frequency street-level flood depth forecasts (+0m, +30m, +1h, +2h, +3h) ahead of convective cloudbursts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0284C7] border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-xs">
                <Layers size={24} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Drainage-Rainfall Coupling</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Connects surface stormwater runoff directly with underground conduit capacity, capturing backwater surcharge when pipes choke.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white text-[#F59E0B] border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-xs">
                <Activity size={24} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Explainable Predictions</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                No black-box scores. Engineers can view exact contributing factors: rainfall intensity, depression depth, and downstream pipe blockage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white text-[#16A34A] border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-xs">
                <Users size={24} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Citizen Ground Truth</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Crowd-sourced geotagged hazard photos provide rapid field verification of overflowing drains and missing manhole grates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] transition-colors md:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0B1F3A] border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-xs">
                <Compass size={24} />
              </div>
              <h4 className="text-lg font-bold text-[#0B1F3A] mb-2">Lowest Predicted Flood-Risk Routing</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Calculates travel paths following verified road geometry that steer clear of high-depth inundation hotspots. We calculate lowest predicted flood-risk routes, never claiming 100% guaranteed safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. TRUST & RESPONSIBLE USE SECTION ───────────────────────────── */}
      <section id="trust" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
              Ethical &amp; Transparent Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A]">
              Trust, precision, and responsible deployment
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              Responsible artificial intelligence means knowing the limits of models and ensuring human-in-the-loop validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-[#2563EB]" />
                <h4 className="text-base font-bold text-[#0B1F3A]">Data Provenance</h4>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Every data point is strictly labeled as <em>observed</em>, <em>simulated</em>, <em>historical</em>, or <em>model-generated</em> to maintain operational integrity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className="text-[#0284C7]" />
                <h4 className="text-base font-bold text-[#0B1F3A]">Calibrated Uncertainty</h4>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                UFIS openly communicates statistical confidence intervals (e.g. 86% confidence) instead of misleading operators with claims of 100% predictive accuracy.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-[#16A34A]" />
                <h4 className="text-base font-bold text-[#0B1F3A]">Human Verification</h4>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Citizen incident reports and algorithmic anomaly alerts trigger municipal verification workflows before initiating expensive field interventions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TEAM KALKI 2.0 & SIH 2026 SECTION ─────────────────────────────── */}
      <section id="team" className="py-20 lg:py-28 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F3A] text-white text-xs font-bold tracking-wider uppercase">
            Team Kalki 2.0 • National Finalist
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            Built by Team Kalki 2.0 for Smart India Hackathon 2026
          </h2>

          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Team Kalki 2.0 is developing UFIS as a practical, explainable, and scalable solution to urban flood resilience under the Ministry problem statement:
            <span className="block mt-2 font-semibold text-[#0B1F3A]">
              "Urban Flood Nowcasting System (Drainage and Rainfall Coupling)"
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="px-4 py-2 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-semibold text-[#334155]">
              Theme: Disaster Management
            </span>
            <span className="px-4 py-2 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-semibold text-[#334155]">
              Category: Smart Governance
            </span>
            <span className="px-4 py-2 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-semibold text-[#334155]">
              Domain: Urban Hydrodynamics
            </span>
          </div>
        </div>
      </section>

      {/* ─── 8. MUNICIPAL FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-[#0B1F3A] text-[#94A3B8] py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm">
                  U
                </div>
                <span className="text-lg font-bold text-white tracking-tight">UFIS</span>
              </div>
              <p className="text-xs leading-relaxed max-w-md">
                UrbanFlood Intelligence System is an AI-powered municipal decision-support system coupling real-time precipitation nowcasting with underground storm drainage hydrodynamics.
              </p>
              <div className="text-[11px] text-[#64748B]">
                Developed by Team Kalki 2.0 • Smart India Hackathon 2026
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Platform Portals
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => onSelectPortal('citizen')} className="hover:text-white transition-colors">
                    Citizen Reporting Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectPortal('admin')} className="hover:text-white transition-colors">
                    Admin Command &amp; Control
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
                    Hydrodynamic Coupling Architecture
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Governance &amp; Trust
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => scrollToSection('trust')} className="hover:text-white transition-colors">
                    Responsible AI Disclaimers
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('team')} className="hover:text-white transition-colors">
                    SIH 2026 Problem Statement
                  </button>
                </li>
                <li>
                  <a href="#control-room" className="hover:text-white transition-colors">
                    GIS Spatial Workbench
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal / Institutional Disclaimer */}
          <div className="pt-8 text-center text-[11px] text-[#64748B] space-y-2">
            <p>
              UFIS is a decision-support prototype engineered for the Smart India Hackathon 2026. Forecast depths and citizen observations should be interpreted in conjunction with official municipal engineering alerts and field verification procedures.
            </p>
            <p>
              &copy; 2026 Team Kalki 2.0 • UFIS UrbanFlood Intelligence System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
