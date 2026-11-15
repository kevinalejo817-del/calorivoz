import { Check, CircleAlert } from 'lucide-react';
import type { ToastItem, ToastType } from '../../contexts/ToastContext';

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-900 text-white border-emerald-700',
  info: 'bg-slate-800 text-white border-slate-700',
  warning: 'bg-amber-800 text-white border-amber-600',
  error: 'bg-rose-800 text-white border-rose-600',
};

export default function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-sm font-medium animate-card-in ${STYLES[t.type]}`}
          style={
            t.leaving
              ? { opacity: 0, transform: 'translateY(6px)', transition: 'all 0.25s ease' }
              : undefined
          }
        >
          {t.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
          ) : (
            <CircleAlert className="w-4 h-4 text-amber-300 shrink-0" strokeWidth={2.5} />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
