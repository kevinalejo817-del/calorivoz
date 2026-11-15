import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import type { Meal } from '../../types';
import MealCard from './MealCard';

interface Props {
  meals: Meal[];
  loading: boolean;
  hasError: boolean;
  onRetry: () => void;
  isToday: boolean;
  day: Date;
  canGoNext: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToday: () => void;
  busyIds: string[];
  clearing: boolean;
  onDelete: (id: string) => void;
  onClearDay: () => Promise<void>;
}

export default function MealHistory(p: Props) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const dayLabel = p.day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const clear = async () => {
    await p.onClearDay();
    setConfirmingClear(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display font-bold text-lg text-slate-900">
            {p.isToday ? 'Historial de Hoy' : 'Historial del día'}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700">
            {p.meals.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-slate-500">
            <button
              type="button"
              onClick={p.onPrevDay}
              aria-label="Día anterior"
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={p.onGoToday}
              disabled={p.isToday}
              title="Volver a hoy"
              className="text-xs font-semibold px-1.5 py-1 rounded-lg enabled:hover:bg-slate-100 disabled:cursor-default cursor-pointer capitalize"
            >
              {p.isToday ? 'Hoy' : dayLabel}
            </button>
            <button
              type="button"
              onClick={p.onNextDay}
              disabled={!p.canGoNext}
              aria-label="Día siguiente"
              className="p-1.5 rounded-lg enabled:hover:bg-slate-100 enabled:hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>

          {p.meals.length > 0 &&
            (confirmingClear ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1">
                <span className="text-xs font-medium text-rose-800">¿Borrar todo?</span>
                <button
                  type="button"
                  disabled={p.clearing}
                  onClick={() => void clear()}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  {p.clearing ? '...' : 'Sí'}
                </button>
                <button
                  type="button"
                  disabled={p.clearing}
                  onClick={() => setConfirmingClear(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-rose-50 cursor-pointer"
              >
                Limpiar día
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        {p.loading ? (
          [0, 1].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 animate-pulse space-y-3" aria-hidden>
              <div className="h-5 w-32 rounded-full bg-slate-100" />
              <div className="h-8 rounded-xl bg-slate-50" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))
        ) : p.hasError ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center">
            <h3 className="font-display font-bold text-base text-slate-800">No pudimos cargar tus comidas</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={p.onRetry}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : p.meals.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6" strokeWidth={2} />
            </div>
            <h3 className="font-display font-bold text-base text-slate-800">
              {p.isToday ? 'Aún no hay comidas registradas hoy' : 'No hay comidas registradas este día'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Usa el micrófono o selecciona uno de los ejemplos de arriba para calcular tu primera comida{p.isToday ? ' del día' : ' de este día'}.
            </p>
          </div>
        ) : (
          p.meals.map((m) => (
            <MealCard key={m.id} meal={m} busy={p.busyIds.includes(m.id)} onDelete={p.onDelete} />
          ))
        )}
      </div>
    </section>
  );
}
