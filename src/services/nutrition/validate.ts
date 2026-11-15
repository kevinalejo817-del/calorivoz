import type { AnalysisResult, FoodItemInput } from '../../types';

function bounded(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(Math.min(n, max) * 10) / 10;
}

/** Valida la respuesta de la IA antes de guardarla. Devuelve null si no es válida. */
export function validateAnalysis(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.items) || obj.items.length === 0 || obj.items.length > 25) return null;

  const items: FoodItemInput[] = [];
  for (const it of obj.items) {
    if (!it || typeof it !== 'object') return null;
    const r = it as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim().slice(0, 200) : '';
    const portion = typeof r.portion === 'string' ? r.portion.trim().slice(0, 200) : '';
    const calories = bounded(r.calories, 5000);
    const protein = bounded(r.protein, 500);
    const carbs = bounded(r.carbs, 1000);
    const fat = bounded(r.fat, 500);
    if (!name || !portion || calories === null || protein === null || carbs === null || fat === null) {
      return null;
    }
    items.push({ name, portion, calories, protein, carbs, fat });
  }
  const tip = typeof obj.tip === 'string' ? obj.tip.trim().slice(0, 500) : '';
  return { items, tip };
}
