import React, { useState } from 'react';
import { ShieldAlert, Mail, KeyRound, AlertCircle, X, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import './admin-portal.css';

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
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="ar-modal-header">
          <div className="ar-modal-title">
            <ShieldAlert size={18} className="text-[#10b981]" />
            <span>Control Room Authentication</span>
          </div>
          <button onClick={onClose} className="ar-modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="ar-modal-body">
          {error && (
            <div className="p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-lg text-[#ef4444] text-xs flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="ar-field">
            <label className="ar-field-label">Official Email</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-[#64748b]">
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem', height: '42px', width: '100%' }}
                className="ar-field-input"
                placeholder="operator@bbmp.gov.in"
              />
            </div>
          </div>

          <div className="ar-field">
            <label className="ar-field-label">Operator Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-[#64748b]">
                <KeyRound size={15} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', height: '42px', width: '100%' }}
                className="ar-field-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="p-3 rounded-lg bg-[rgba(8,15,30,0.8)] border border-[#10b981]/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
              <span>Demo Credentials</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('operator@bbmp.gov.in');
                  setPassword('admin123');
                }}
                className="text-[#38bdf8] hover:underline bg-transparent border-none cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] ar-mono">
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-[#64748b] block text-[9px]">Email</span>
                <span className="text-white truncate block">operator@bbmp.gov.in</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-[#64748b] block text-[9px]">Pass</span>
                <span className="text-white">admin123</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ar-btn-primary py-3"
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Center'}
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
