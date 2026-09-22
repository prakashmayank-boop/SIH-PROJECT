import React, { useState } from 'react';
import { X, Send, PhoneCall, Users, ShieldAlert, CheckCircle2, AlertCircle, Radio } from 'lucide-react';
import type { AlertItem } from '../types';
import { apiService } from '../services/api';
import './admin-portal.css';

interface SmsBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert?: AlertItem | null;
  onSmsSent?: () => void;
}

export const SmsBroadcastModal: React.FC<SmsBroadcastModalProps> = ({
  isOpen,
  onClose,
  alert,
  onSmsSent
}) => {
  const [recipientGroup, setRecipientGroup] = useState('all_citizens');
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultMsg = alert
    ? `[BBMP FLOOD ALERT] ${alert.severity}: Waterlogging (${alert.payload?.max_predicted_depth_cm ?? 28} cm) predicted on ${(alert.payload?.affected_roads || ['80 Feet Rd', 'ST Bed']).join(' & ')} due to surcharge at ${(alert.payload?.critical_nodes || ['MH-04', 'MH-07']).join(', ')}. Avoid route. Detour: 4th Block Ridge. Helpline: 1533 / 112.`
    : `[BBMP FLOOD ALERT] CRITICAL: Heavy rainfall surcharge detected in Koramangala Ward 151. Avoid low-lying corridors. Helpline: 1533.`;

  const activeMsg = customMessage.trim() || defaultMsg;

  const handleSendSms = async () => {
    setError(null);
    setSuccessResult(null);

    const hasCustomPhone = customPhone.trim().length > 0;
    const targetGroup = hasCustomPhone ? 'custom' : recipientGroup;

    if (recipientGroup === 'custom' && !hasCustomPhone) {
      setError('Please enter a recipient mobile number (e.g., 7970699027) or select a preset group above.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        alert_id: alert?.alert_id || 'ALERT-MANUAL',
        title: alert?.title || 'Emergency Flood Alert',
        severity: alert?.severity || 'CRITICAL',
        affected_roads: alert?.payload?.affected_roads || ['80 Feet Road', 'ST Bed Main Avenue'],
        max_depth_cm: alert?.payload?.max_predicted_depth_cm || 28.5,
        critical_nodes: alert?.payload?.critical_nodes || ['MH-04', 'MH-07'],
        recipient_group: targetGroup,
        custom_phone: hasCustomPhone ? customPhone.trim() : undefined,
        custom_message: customMessage.trim() || undefined
      };

      const res = await apiService.broadcastSms(payload);
      setSuccessResult(res);
      if (onSmsSent) onSmsSent();
    } catch (err: any) {
      console.error('SMS Dispatch Error:', err);
      setError(err.message || 'Failed to dispatch emergency SMS. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ar-modal-backdrop">
      <div className="ar-modal-box" style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="ar-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444]">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                Emergency Flood SMS Broadcast
              </h3>
              <p className="text-[10px] text-[#64748b] ar-mono">
                TRAI / NDMA multi-carrier emergency alert gateway
              </p>
            </div>
          </div>
          <button onClick={onClose} className="ar-modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="ar-modal-body">
          {/* Target Group Selector */}
          <div className="ar-field">
            <label className="ar-field-label flex items-center gap-1.5">
              <Users size={12} className="text-[#38bdf8]" />
              Select Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all_citizens', label: 'Ward 151 Citizens', count: '14,250 registered', icon: Users },
                { id: 'emergency_responders', label: 'QRT & Ambulances', count: '48 emergency units', icon: ShieldAlert },
                { id: 'traffic_police', label: 'Traffic Police Patrols', count: '16 mobile units', icon: PhoneCall },
                { id: 'custom', label: 'Custom Direct Mobile', count: 'Single phone dispatch', icon: Send },
              ].map(g => {
                const Icon = g.icon;
                const active = recipientGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setRecipientGroup(g.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#0F172A] shadow-sm shadow-[#ef4444]/10'
                        : 'bg-white border-slate-200 text-[#475569] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={14} className={active ? 'text-[#ef4444]' : 'text-[#94a3b8]'} />
                      <span className="font-bold text-xs text-[#0F172A] leading-tight">{g.label}</span>
                    </div>
                    <span className="text-[10px] text-[#64748b] ar-mono block">{g.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Phone Number Input if selected */}
          {recipientGroup === 'custom' && (
            <div className="space-y-2 bg-sky-50 p-3 rounded-lg border border-[#0284C7]/25">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-[#38bdf8] block">
                  Recipient Mobile Number
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const randomDigits = Math.floor(6000000000 + Math.random() * 3999999999);
                    setCustomPhone(`+91 ${randomDigits}`);
                  }}
                  className="text-[10px] bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] px-2 py-0.5 rounded ar-mono transition-all flex items-center gap-1 border border-[#38bdf8]/40 cursor-pointer"
                >
                  🎲 Generate Random Number
                </button>
              </div>
              <input
                type="text"
                placeholder="+91 98765 43210 or 10-digit number"
                value={customPhone}
                onChange={e => {
                  setCustomPhone(e.target.value);
                  if (recipientGroup !== 'custom') setRecipientGroup('custom');
                }}
                className="ar-field-input ar-mono"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#64748b]">Presets:</span>
                {['+91 79706 99027', '+91 98765 43210', '+91 94480 99911'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCustomPhone(num);
                      setRecipientGroup('custom');
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded ar-mono border transition-all cursor-pointer ${
                      customPhone.replace(/\s+/g, '') === num.replace(/\s+/g, '')
                        ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981] font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-[#475569] border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div className="ar-field">
            <div className="flex items-center justify-between mb-1">
              <label className="ar-field-label">
                SMS Payload ({activeMsg.length}/160 chars)
              </label>
              {customMessage && (
                <button
                  onClick={() => setCustomMessage('')}
                  className="text-[10px] text-[#38bdf8] hover:underline cursor-pointer bg-transparent border-none"
                >
                  Reset Template
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={customMessage || defaultMsg}
              onChange={e => setCustomMessage(e.target.value)}
              className="ar-field-input ar-mono"
              style={{ resize: 'none', lineHeight: '1.5' }}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successResult && (
            <div className="p-3.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-[#0F172A] space-y-1">
              <div className="flex items-center gap-2 text-[#059669] font-bold text-xs">
                <CheckCircle2 size={16} />
                <span>{successResult.message}</span>
              </div>
              <div className="text-[11px] text-[#64748b] ar-mono pt-1">
                Carrier Ref: <span className="text-[#0284C7]">{successResult.carrier_reference}</span> &bull; Dispatched to <span className="text-[#0F172A] font-bold">{successResult.recipients_count.toLocaleString()}</span> recipients
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleSendSms}
            disabled={loading}
            className="ar-btn-primary py-3"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Send size={14} />
            {loading
              ? 'Transmitting Emergency Alert via Carrier Gateway...'
              : customPhone.trim()
                ? `Broadcast Emergency Flood SMS to ${customPhone.trim()}`
                : `Broadcast Emergency Flood SMS (${recipientGroup === 'all_citizens' ? '14,250' : recipientGroup === 'emergency_responders' ? '48' : '16'} Recipients)`}
          </button>
        </div>
      </div>
    </div>
  );
};
