import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-50/95 dark:bg-[#0D261A]/95 text-emerald-900 dark:text-emerald-100';
      case 'error':
        return 'border-rose-500/40 bg-rose-50/95 dark:bg-[#2A1215]/95 text-rose-900 dark:text-rose-100';
      case 'warning':
        return 'border-amber-500/40 bg-amber-50/95 dark:bg-[#2A200E]/95 text-amber-900 dark:text-amber-100';
      case 'info':
      default:
        return 'border-teal-500/40 bg-teal-50/95 dark:bg-[#0E2326]/95 text-teal-900 dark:text-teal-100';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in max-w-md w-full ${getBorderColor()}`}
      role="alert"
    >
      {getIcon()}
      <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
