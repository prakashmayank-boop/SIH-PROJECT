import React, { useState } from 'react';
import { ShieldAlert, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('operator@bbmp.gov.in');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.login(email, password);
      localStorage.setItem('ufis_token', data.access_token);
      localStorage.setItem('ufis_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Invalid credentials. Demo account: operator@bbmp.gov.in / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-[#334155] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">UFIS Authentication</h2>
            <p className="text-xs text-[#94a3b8]">Urban Flood Nowcasting Portal Access</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded text-[#ef4444] flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#94a3b8] font-semibold block text-xs">Official Email</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748b]">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '2.6rem', paddingRight: '1rem', height: '42px' }}
                className="w-full bg-[#111c2d] border border-[#334155] rounded-xl text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#10b981] transition-all"
                placeholder="operator@bbmp.gov.in"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#94a3b8] font-semibold block text-xs">Operator Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748b]">
                <KeyRound size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '2.6rem', paddingRight: '1rem', height: '42px' }}
                className="w-full bg-[#111c2d] border border-[#334155] rounded-xl text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#10b981] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#081425] border border-[#10b981]/30 text-[#94a3b8] text-[11px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#10b981] text-[10px] uppercase tracking-wider">Demo Credentials</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('operator@bbmp.gov.in');
                  setPassword('admin123');
                }}
                className="text-[10px] text-[#38bdf8] hover:underline"
              >
                Auto-fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#111c2d] p-1.5 rounded border border-white/5 truncate font-mono text-[10px] text-white">
                operator@bbmp.gov.in
              </div>
              <div className="bg-[#111c2d] p-1.5 rounded border border-white/5 font-mono text-[10px] text-white">
                admin123
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-[#94a3b8] hover:bg-[#1e293b] transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-5 py-2 text-xs font-semibold"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
