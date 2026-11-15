import type { ReactNode } from 'react';
import { LogoMark, LogoText } from '../Header/Logo';

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <LogoMark />
          <div className="flex items-center gap-2">
            <LogoText />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              IA Nutricional
            </span>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-7">
          <h1 className="font-display font-bold text-xl text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1 mb-5">{subtitle}</p>}
          {!subtitle && <div className="mb-5" />}
          {children}
        </div>
        {footer && <div className="text-center text-sm text-slate-500 mt-5">{footer}</div>}
      </div>
    </main>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all';

export function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
    </div>
  );
}

export function FormMessage({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const styles =
    kind === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-900';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({ loading, children, ...props }: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-display font-bold text-base shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
    >
      {children}
    </button>
  );
}
