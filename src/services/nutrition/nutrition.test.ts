import { describe, expect, it } from 'vitest';
import { analyzeWithLocalEngine, extractMultiplier } from './localEngine';
import { validateAnalysis } from './validate';
import { computeDayTotals, macroTargets } from '../../utils/macros';
import { consumedAtFor, dayBoundsISO, isSameLocalDay } from '../../utils/date';
import type { Meal } from '../../types';

describe('motor local', () => {
  it('detecta alimentos y multiplicadores', () => {
    const r = analyzeWithLocalEngine('2 tacos al pastor y un agua de jamaica');
    expect(r.items.map((i) => i.name)).toEqual(['Taco al pastor con tortilla de maíz', 'Agua fresca de jamaica']);
    expect(r.items[0].calories).toBe(350);
  });

  it('no parte "café con leche"', () => {
    const r = analyzeWithLocalEngine('un café con leche');
    expect(r.items).toHaveLength(1);
    expect(r.items[0].name).toBe('Café con leche');
  });

  it('usa porción genérica si no reconoce nada', () => {
    const r = analyzeWithLocalEngine('algo raro inventado');
    expect(r.items).toHaveLength(1);
    expect(r.items[0].calories).toBe(340);
  });

  it('avisa de partes no reconocidas', () => {
    const r = analyzeWithLocalEngine('arroz y zzzxyz');
    expect(r.items).toHaveLength(1);
    expect(r.tip).toContain('zzzxyz');
  });

  it('multiplicadores', () => {
    expect(extractMultiplier('medio aguacate')).toBe(0.5);
    expect(extractMultiplier('tres huevos')).toBe(3);
    expect(extractMultiplier('un huevo')).toBe(1);
  });
});

describe('validación de respuesta de IA', () => {
  const ok = { items: [{ name: 'Pan', portion: '1', calories: 80, protein: 3, carbs: 15, fat: 1 }], tip: 'ok' };
  it('acepta una respuesta válida', () => expect(validateAnalysis(ok)).not.toBeNull());
  it('rechaza items vacíos', () => expect(validateAnalysis({ items: [], tip: '' })).toBeNull());
  it('rechaza números inválidos', () => {
    expect(validateAnalysis({ items: [{ ...ok.items[0], calories: -5 }], tip: '' })).toBeNull();
    expect(validateAnalysis({ items: [{ ...ok.items[0], calories: 'abc' }], tip: '' })).toBeNull();
  });
  it('limita valores absurdos', () => {
    const r = validateAnalysis({ items: [{ ...ok.items[0], calories: 99999 }], tip: '' });
    expect(r?.items[0].calories).toBe(5000);
  });
});

describe('totales y metas', () => {
  const meal = (cal: number, p: number): Meal => ({
    id: 'x', mealType: 'Cena', description: 'd', source: 'text', engine: 'gemini', tip: '',
    consumedAt: new Date().toISOString(),
    items: [{ id: 'i', name: 'n', portion: 'p', calories: cal, protein: p, carbs: 1, fat: 1 }],
  });
  it('suma comidas', () => {
    const t = computeDayTotals([meal(100.4, 5), meal(200.4, 7.25)]);
    expect(t.calories).toBe(301);
    expect(t.protein).toBe(12.3);
  });
  it('metas de macros 25/50/25', () => {
    expect(macroTargets(2000)).toEqual({ protein: 125, carbs: 250, fat: 56 });
  });
});

describe('fechas locales', () => {
  it('el rango del día es de 24 h (o 23/25 en cambio de hora) y contiene la fecha', () => {
    const d = new Date(2026, 5, 10, 23, 59);
    const { start, end } = dayBoundsISO(d);
    expect(new Date(start).getTime()).toBeLessThanOrEqual(d.getTime());
    expect(new Date(end).getTime()).toBeGreaterThan(d.getTime());
    expect(isSameLocalDay(new Date(start), d)).toBe(true);
    expect(isSameLocalDay(new Date(end), d)).toBe(false);
  });
  it('consumedAtFor mantiene el día elegido', () => {
    const past = new Date(2026, 0, 5);
    expect(isSameLocalDay(consumedAtFor(past, new Date(2026, 5, 10, 14, 30)), past)).toBe(true);
  });
});
