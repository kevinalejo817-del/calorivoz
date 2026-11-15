import { useState } from 'react';
import { Leaf } from 'lucide-react';
import type { Meal, MealSource, MealType } from '../../types';
import { formatTime } from '../../utils/date';
import { sumItems } from '../../utils/macros';

const BADGES: Record<MealType, { bg: string; icon: string }> = {
  Desayuno: { bg: 'bg-amber-50 text-amber-800 border-amber-200/70', icon: '☀️' },
  Almuerzo: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/70', icon: '🍽️' },
  Cena: { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/70', icon: '🌙' },
  Snack: { bg: 'bg-rose-50 text-rose-800 border-rose-200/70', icon: '🍎' },
};

const SOURCE_LABELS: Record<MealSource, string> = {
  text: 'Texto',
  voice: 'Voz',
  voice_simulated: 'Voz simulada',
  quick_example: 'Ejemplo rápido',
};

interface Props {
  meal: Meal;
  busy: boolean;
  onDelete: (id: string) => void;
}

export default function MealCard({ meal, busy, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const badge = BADGES[meal.mealType] ?? BADGES.Almuerzo;
  const t = sumItems(meal.items);

  return (
    <article className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-5 sm:p-6 animate-card-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
            <span>{badge.icon}</span> {meal.mealType}
          </span>
          <span className="text-xs text-slate-400 font-medium">{formatTime(meal.consumedAt)}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
            {SOURCE_LABELS[meal.source] ?? meal.source}
          </span>
          {meal.engine === 'fallback' && (
            <span
              title="Calculado con el motor local de respaldo; es una estimación aproximada, menos precisa que el análisis con IA."
              className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70"
            >
              Estimación de respaldo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="font-display font-extrabold text-lg text-emerald-800">{Math.round(t.calories)}</span>{' '}
            <span className="text-xs font-semibold text-emerald-700">kcal</span>
          </div>
          {confirming ? (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1">
              <span className="text-xs font-medium text-rose-800">¿Eliminar?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(meal.id)}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-2 py-0.5 rounded-md cursor-pointer"
              >
                {busy ? '...' : 'Sí'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Eliminar comida"
              aria-label="Eliminar registro"
              onClick={() => setConfirming(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 italic bg-slate-50/80 rounded-xl px-3.5 py-2 mb-3.5 border border-slate-100">
        “{meal.description}”
      </p>

      <div className="mb-3.5">
        {meal.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-2.5 border-b border-slate-100 last:border-none"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-400">{item.portion}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">P: {Math.round(item.protein)}g</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">C: {Math.round(item.carbs)}g</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">G: {Math.round(item.fat)}g</span>
              </div>
              <span className="text-sm font-bold text-slate-800 min-w-[64px] text-right">{Math.round(item.calories)} kcal</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mb-3.5">
        <span className="font-semibold text-slate-500">Total comida:</span>
        <div className="flex items-center gap-3 font-semibold">
          <span className="text-rose-600">Proteínas: {Math.round(t.protein)}g</span>
          <span className="text-amber-600">Carbos: {Math.round(t.carbs)}g</span>
          <span className="text-teal-600">Grasas: {Math.round(t.fat)}g</span>
        </div>
      </div>

      {meal.tip && (
        <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-3.5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <Leaf className="w-3.5 h-3.5" strokeWidth={2.4} />
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            <strong className="font-semibold">Consejo nutricional:</strong> {meal.tip}
          </p>
        </div>
      )}
    </article>
  );
}
