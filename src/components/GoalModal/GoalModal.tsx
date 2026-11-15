import { useEffect, useRef, useState } from 'react';
import { Target, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const PRESETS = [
  { value: 1500, label: '1,500 kcal (Déficit)' },
  { value: 2000, label: '2,000 kcal (Estándar)' },
  { value: 2500, label: '2,500 kcal (Activo)' },
];

interface Props {
  open: boolean;
  currentGoal: number;
  saving: boolean;
  onClose: () => void;
  onSave: (goal: number) => Promise<void>;
}

export default function GoalModal({ open, currentGoal, saving, onClose, onSave }: Props) {
  const toast = useToast();
  const [value, setValue] = useState(String(currentGoal));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(String(currentGoal));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, currentGoal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (saving) return;
    const val = parseInt(value, 10);
    if (Number.isNaN(val) || val < 800 || val > 8000) {
      toast.show('Ingresa una meta válida entre 800 y 8,000 kcal.', 'warning');
      return;
    }
    await onSave(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 animate-card-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goalModalTitle"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" strokeWidth={2} />
            </div>
            <h3 id="goalModalTitle" className="font-display font-bold text-lg text-slate-900">
              Meta Diaria de Calorías
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Define tu objetivo calórico diario. Tus metas de proteínas, carbohidratos y grasas se recalcularán automáticamente.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="goalInput" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Calorías objetivo (kcal)
            </label>
            <input
              id="goalInput"
              ref={inputRef}
              type="number"
              min={800}
              max={8000}
              step={50}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-display font-bold text-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue(String(p.value))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Meta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
