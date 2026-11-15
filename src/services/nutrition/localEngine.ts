import type { AnalysisResult, FoodItemInput } from '../../types';
import { LOCAL_FOOD_DB } from './foodDb';

export function normalizeSpanish(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function extractMultiplier(segment: string): number {
  const norm = normalizeSpanish(segment);
  if (/\b(medio|media|1\/2)\b/.test(norm)) return 0.5;
  if (/\b(dos|2)\b/.test(norm)) return 2;
  if (/\b(tres|3)\b/.test(norm)) return 3;
  if (/\b(cuatro|4)\b/.test(norm)) return 4;
  return 1;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Motor nutricional de respaldo (sin IA). Es una ESTIMACIÓN aproximada basada en
 * un diccionario local; no tiene la precisión de un análisis con Gemini.
 */
export function analyzeWithLocalEngine(description: string): AnalysisResult {
  // "café con leche" no debe partirse por la conjunción "con".
  const protectedText = description.replace(/(caf[eé]) con leche/gi, '$1_con_leche');
  const parts = protectedText
    .split(/,| y | con | más |\+/i)
    .map((s) => s.trim().replace(/_con_leche/g, ' con leche'))
    .filter(Boolean);

  const items: FoodItemInput[] = [];
  const usedNames = new Set<string>();
  const unrecognized: string[] = [];

  for (const part of parts) {
    const normPart = normalizeSpanish(part);
    const mult = extractMultiplier(normPart);
    let matched = false;

    for (const entry of LOCAL_FOOD_DB) {
      const key = entry.keys.find((k) => normPart.includes(k));
      if (!key) continue;
      matched = true;
      if (!usedNames.has(entry.name)) {
        usedNames.add(entry.name);
        items.push({
          name: entry.name,
          portion: mult !== 1 ? `${mult}x ${entry.portion}` : entry.portion,
          calories: Math.round(entry.calories * mult),
          protein: round1(entry.protein * mult),
          carbs: round1(entry.carbs * mult),
          fat: round1(entry.fat * mult),
        });
      }
      break;
    }
    if (!matched) unrecognized.push(part);
  }

  // Sin coincidencias: porción genérica (valor muy aproximado).
  if (items.length === 0) {
    const label = description.charAt(0).toUpperCase() + description.slice(1);
    items.push({
      name: label.length > 48 ? label.slice(0, 48) + '...' : label,
      portion: '1 porción estándar (250g)',
      calories: 340,
      protein: 16,
      carbs: 38,
      fat: 12,
    });
  }

  const totalProt = items.reduce((a, b) => a + b.protein, 0);
  const totalCarbs = items.reduce((a, b) => a + b.carbs, 0);

  let tip = 'Recuerda acompañar tus comidas con suficiente agua natural y vegetales frescos para mejorar la digestión.';
  if (totalProt >= 25) {
    tip = '¡Gran aporte proteico! Esta comida favorece la recuperación muscular y te mantendrá satisfecho por más tiempo.';
  } else if (totalCarbs >= 45) {
    tip = 'Buena fuente de energía para tus actividades del día; procura combinarla con fibra o proteína magra.';
  }

  // Transparencia: avisar de lo que el motor local no pudo estimar.
  if (unrecognized.length > 0 && items.length > 0 && !(unrecognized.length === parts.length)) {
    tip += ` Nota: no se pudo estimar "${unrecognized.join('", "')}"; no se incluyó en el total.`;
  }

  return { items, tip };
}
