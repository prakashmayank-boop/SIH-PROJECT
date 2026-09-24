import React, { useState } from 'react';
import { ShieldAlert, Mail, KeyRound, AlertCircle, ArrowRight, CloudRain, Activity, Layers } from 'lucide-react';
import { apiService } from '../services/api';
import './admin-portal.css';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('operator@bbmp.gov.in');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.login(email, password);
      localStorage.setItem('ufis_token', data.access_token);
      localStorage.setItem('ufis_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
    } catch (err: any) {
      console.error('[Login Error]', err);
      const msg: string = err?.message || '';

      if (msg.startsWith('NETWORK_ERROR')) {
        // Backend unreachable — connection refused, CORS block, EC2 down etc.
        setError('Cannot connect to UFIS server. Please check your internet connection or contact the administrator.');
      } else if (msg.startsWith('API_ERROR:401')) {
        // HTTP 401 — wrong email or password
        setError('Invalid email or password. Demo: operator@bbmp.gov.in / admin123');
      } else if (msg.startsWith('API_ERROR:')) {
        // Other HTTP error from backend
        const detail = msg.split(':').slice(2).join(':');
        setError(`Server error: ${detail}`);
      } else {
        // Unknown / unexpected error
        setError(`Unexpected error: ${msg || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#081425] flex overflow-hidden select-none">
      {/* Left Column: Visual Showcase & Problem Statement Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-[#0b1728] border-r border-[#1e293b] flex-col justify-between p-12 overflow-hidden">
        {/* Background Urban Flood Hydrodynamic Art */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 scale-105"
          style={{ backgroundImage: `url('/login_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#081425] via-[#0b1728]/85 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/15 via-transparent to-[#081425]/60" />

        {/* Ambient Glows */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Branding Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shadow-lg shadow-[#10b981]/10">
            <ShieldAlert size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-wider">UFIS</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-[#86948a] font-medium">Urban Flood Intelligence System</p>
          </div>
        </div>

        {/* Problem Statement Hero Card */}
        <div className="relative z-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e293b] border border-[#334155] text-xs text-[#38bdf8]">
            <CloudRain size={14} />
            <span className="font-semibold">Dynamic Drainage &amp; Rainfall Coupling</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Real-Time Street Inundation &amp; Hydrodynamic Decision Support
          </h2>

          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Coupling high-resolution 30m SRTM Digital Elevation Models with 1D stormwater network capacities and 0–3h nowcasting timelines for proactive flood mitigation.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="glass-panel p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-[#10b981]">
                <Activity size={16} />
                <span className="font-bold text-sm">30m DEM</span>
              </div>
              <p className="text-[11px] text-[#64748b]">Real Terrain Elevation</p>
            </div>

            <div className="glass-panel p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-[#38bdf8]">
                <Layers size={16} />
                <span className="font-bold text-sm">0–3h Nowcast</span>
              </div>
              <p className="text-[11px] text-[#64748b]">Hydrograph Timeline</p>
            </div>

            <div className="glass-panel p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-[#f59e0b]">
                <ShieldAlert size={16} />
                <span className="font-bold text-sm">Safe Route</span>
              </div>
              <p className="text-[11px] text-[#64748b]">Emergency Detour</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-[#64748b] flex items-center justify-between border-t border-[#1e293b] pt-6">
          <span>Smart India Hackathon 2026</span>
          <span>Bruhat Bengaluru Mahanagara Palike (BBMP) Pilot</span>
        </div>
      </div>

      {/* Right Column: Portal Login Form */}
      <div className="w-full lg:w-[480px] bg-[#081425] flex flex-col justify-between p-8 sm:p-12 z-10">
        <div />

        <div className="max-w-sm mx-auto w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-widest">BBMP Control Center</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Operator Sign In</h2>
            <p className="text-xs text-[#86948a] mt-1.5 leading-relaxed">
              Enter your municipal credentials to access the real-time flood nowcasting dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-xl text-[#ef4444] text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#d8e3fb] block">Official Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748b]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.6rem', paddingRight: '1rem', height: '44px' }}
                  className="w-full bg-[#111c2d] border border-[#2a374d] rounded-xl text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/30 transition-all shadow-inner"
                  placeholder="operator@bbmp.gov.in"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#d8e3fb] block">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748b]">
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.6rem', paddingRight: '1rem', height: '44px' }}
                  className="w-full bg-[#111c2d] border border-[#2a374d] rounded-xl text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/30 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Quick Demo Credentials Box */}
            <div className="p-3.5 rounded-xl bg-[#0d1829] border border-[#10b981]/30 shadow-md space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10b981]">Demo Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('operator@bbmp.gov.in');
                    setPassword('admin123');
                  }}
                  className="text-[10px] text-[#38bdf8] hover:text-white transition-colors font-semibold"
                >
                  Auto-fill
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#111c2d] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-[#64748b] block mb-0.5">Email</span>
                  <span className="font-mono text-white text-[11px] block truncate">operator@bbmp.gov.in</span>
                </div>
                <div className="bg-[#111c2d] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-[#64748b] block mb-0.5">Password</span>
                  <span className="font-mono text-white text-[11px] block">admin123</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ height: '46px' }}
              className="w-full rounded-xl bg-[#10b981] hover:bg-[#0ea371] text-[#003824] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-4"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-[#64748b] pt-6 flex flex-col items-center gap-2">
          <span>UFIS 2026 Platform &bull; Protected Municipal Network</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
            }}
            className="text-xs text-[#38bdf8] hover:text-[#7dd3fc] hover:underline transition font-semibold"
          >
            ← Back to Citizen Portal
          </a>
        </div>
      </div>
    </div>
  );
};
