import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {}
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-[#10b981] flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={16} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />,
  error: <AlertTriangle size={16} className="text-[#ef4444] flex-shrink-0 mt-0.5" />,
  info: <Info size={16} className="text-[#38bdf8] flex-shrink-0 mt-0.5" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-[#10b981]/40',
  warning: 'border-[#f59e0b]/40',
  error: 'border-[#ef4444]/40',
  info: 'border-[#38bdf8]/40',
};

const PROGRESS_BG: Record<ToastType, string> = {
  success: 'bg-[#10b981]',
  warning: 'bg-[#f59e0b]',
  error: 'bg-[#ef4444]',
  info: 'bg-[#38bdf8]',
};

const GLOW: Record<ToastType, string> = {
  success: 'shadow-[#10b981]/15',
  warning: 'shadow-[#f59e0b]/15',
  error: 'shadow-[#ef4444]/15',
  info: 'shadow-[#38bdf8]/15',
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const dur = toast.duration ?? 5000;

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    // Entrance animation frame
    const enterTimer = setTimeout(() => setIsEntering(false), 20);
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(triggerDismiss, dur);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [dur, triggerDismiss]);

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 w-[330px] p-3.5 rounded-xl
        bg-white border ${BORDERS[toast.type]} shadow-lg ${GLOW[toast.type]}
        transition-all duration-300 ease-out transform
        ${isEntering ? 'opacity-0 translate-x-10 scale-95' : isExiting ? 'opacity-0 translate-x-12 scale-90' : 'opacity-100 translate-x-0 scale-100'}
      `}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold text-[#0F172A] leading-tight tracking-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={triggerDismiss}
        className="text-[#94a3b8] hover:text-[#0F172A] transition-colors p-0.5 rounded hover:bg-slate-100 flex-shrink-0"
      >
        <X size={13} />
      </button>

      {/* Animated Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
        <div
          className={`h-full ${PROGRESS_BG[toast.type]} rounded-full`}
          style={{
            animation: `toastProgress ${dur}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${counterRef.current++}`;
    // Max 4 stacked toasts, newest on top
    setToasts(prev => [{ ...toast, id }, ...prev].slice(0, 4));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {/* Keyframe style for linear progress bar */}
      <style>{`
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
      {children}

      {/* Global Top-Right Toast Stack */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
