import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import ToastContainer from '../components/Toast/ToastContainer';

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastApi {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, type, leaving: false }]);
    const life = type === 'error' ? 5200 : 3200;
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), life);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), life + 260);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
