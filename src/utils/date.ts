/** Utilidades de fecha basadas en la zona horaria local del usuario. */

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Límites [inicio, fin) del día local, en ISO UTC, para consultar timestamptz. */
export function dayBoundsISO(d: Date): { start: string; end: string } {
  const start = startOfLocalDay(d);
  const end = addDays(start, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function toDayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Momento en que se registra una comida para el día mostrado (hora actual). */
export function consumedAtFor(day: Date, now: Date = new Date()): Date {
  if (isSameLocalDay(day, now)) return now;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), now.getHours(), now.getMinutes());
}

export function formatLongDate(d: Date): string {
  const formatted = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
