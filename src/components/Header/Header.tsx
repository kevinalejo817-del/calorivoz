import { LogOut, Pencil, Target } from 'lucide-react';
import { LogoMark, LogoText } from './Logo';
import { formatLongDate } from '../../utils/date';
import { fmt } from '../../utils/macros';

interface Props {
  today: Date;
  goal: number;
  onOpenGoal: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

export default function Header({ today, goal, onOpenGoal, onSignOut, userEmail }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LogoMark />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LogoText />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                IA Nutricional
              </span>
            </div>
            <p className="text-xs text-slate-500 capitalize truncate">{formatLongDate(today)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenGoal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 transition-all text-sm font-medium cursor-pointer"
          >
            <Target className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
            <span>
              Meta: <strong className="font-semibold text-slate-900">{fmt(goal)}</strong> kcal
            </span>
            <Pencil className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title={userEmail ? `Cerrar sesión (${userEmail})` : 'Cerrar sesión'}
            aria-label="Cerrar sesión"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
