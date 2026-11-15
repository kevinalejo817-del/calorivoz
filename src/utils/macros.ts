import type { Meal, Totals } from '../types';

const num = (v: unknown): number => Number(v) || 0;

export function sumItems(items: { calories: number; protein: number; carbs: number; fat: number }[]): Totals {
  return items.reduce<Totals>(
    (acc, i) => ({
      calories: acc.calories + num(i.calories),
      protein: acc.protein + num(i.protein),
      carbs: acc.carbs + num(i.carbs),
      fat: acc.fat + num(i.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Totales del día, redondeados igual que en el diseño original. */
export function computeDayTotals(meals: Meal[]): Totals {
  const t = sumItems(meals.flatMap((m) => m.items));
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein * 10) / 10,
    carbs: Math.round(t.carbs * 10) / 10,
    fat: Math.round(t.fat * 10) / 10,
  };
}

/** Distribución sugerida: 25 % proteínas, 50 % carbohidratos, 25 % grasas. */
export function macroTargets(goal: number) {
  return {
    protein: Math.round((goal * 0.25) / 4),
    carbs: Math.round((goal * 0.5) / 4),
    fat: Math.round((goal * 0.25) / 9),
  };
}

export const fmt = (n: number): string => n.toLocaleString('es-ES');
