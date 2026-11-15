import { Mic } from 'lucide-react';

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center text-white shadow-sm shrink-0 ${className}`}
    >
      <Mic className="w-6 h-6" strokeWidth={2} />
    </div>
  );
}

export function LogoText() {
  return (
    <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
      Calori<span className="text-emerald-600">Voz</span>
    </span>
  );
}
