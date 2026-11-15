import { Clock, DollarSign } from 'lucide-react';
import type { Totals } from '../../types';
import { fmt, macroTargets } from '../../utils/macros';

const RING_CIRCUMFERENCE = 2 * Math.PI * 80;

interface Props {
  goal: number;
  totals: Totals;
  isToday: boolean;
}

function MacroBar({
  label, dot, bar, value, target, percent,
}: { label: string; dot: string; bar: string; value: number; target: number; percent: number }) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-sm mb-1.5">
        <span className="font-semibold text-slate-700 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="text-xs font-medium text-slate-500">
          <strong className="text-slate-900 font-bold">{Math.round(value)}</strong>g / <span>{target}</span>g
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`macro-bar-fill h-full ${bar} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function DailySummary({ goal, totals, isToday }: Props) {
  const remaining = goal - totals.calories;
  const over = remaining < 0;
  const rawPercent = goal > 0 ? Math.round((totals.calories / goal) * 100) : 0;
  const clamped = Math.min(rawPercent, 100);
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;
  const excess = Math.abs(remaining);
  const targets = macroTargets(goal);
  const pct = (v: number, t: number) => (t > 0 ? Math.min((v / t) * 100, 100) : 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900">Resumen Diario</h2>
          <p className="text-xs text-slate-500">Balance calórico y macronutrientes</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            over
              ? 'bg-rose-50 text-rose-700 border-rose-200/70'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
          }`}
        >
          {rawPercent}% de la meta
        </span>
      </div>

      <div className="relative flex items-center justify-center my-4">
        <svg className="w-52 h-52 sm:w-56 sm:h-56" viewBox="0 0 200 200" aria-label="Progreso diario de calorías">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#F1F5F9" strokeWidth="15" />
          <circle
            className="progress-ring-circle"
            cx="100" cy="100" r="80" fill="none"
            stroke={over ? '#F43F5E' : '#10B981'}
            strokeWidth="15" strokeLinecap="round"
            strokeDasharray="502.65"
            style={{ strokeDashoffset: offset }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Consumidas</span>
          <span className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 leading-tight mt-0.5">
            {fmt(totals.calories)}
          </span>
          <span className="text-xs font-medium text-slate-500">de <span>{fmt(goal)}</span> kcal</span>
          <div
            className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              over ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {over ? `+${fmt(excess)} kcal sobre meta` : `${fmt(remaining)} kcal restantes`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 mb-6">
        <div className="rounded-2xl bg-slate-50/90 border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">{isToday ? 'Ingesta Hoy' : 'Ingesta del día'}</p>
            <p className="font-display font-bold text-base text-slate-900">
              <span>{fmt(totals.calories)}</span> <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50/90 border border-slate-100 p-3.5 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              over ? 'bg-rose-100/80 text-rose-700' : 'bg-amber-100/80 text-amber-700'
            }`}
          >
            <Clock className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">{over ? 'Excedente' : 'Disponibles'}</p>
            <p className="font-display font-bold text-base text-slate-900">
              <span>{over ? `+${fmt(excess)}` : fmt(remaining)}</span>{' '}
              <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Macronutrientes</h3>
          <span className="text-[11px] text-slate-400">Distribución sugerida</span>
        </div>
        <MacroBar label="Proteínas" dot="bg-rose-500" bar="bg-rose-500" value={totals.protein} target={targets.protein} percent={pct(totals.protein, targets.protein)} />
        <MacroBar label="Carbohidratos" dot="bg-amber-500" bar="bg-amber-500" value={totals.carbs} target={targets.carbs} percent={pct(totals.carbs, targets.carbs)} />
        <MacroBar label="Grasas Saludables" dot="bg-teal-500" bar="bg-teal-500" value={totals.fat} target={targets.fat} percent={pct(totals.fat, targets.fat)} />
      </div>
    </div>
  );
}
