import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meal, NewMealInput } from '../types';
import { createMeal, deleteMeal, deleteMealsBetween, fetchMealsBetween } from '../services/supabase/meals';
import { dayBoundsISO, parseDayKey, toDayKey } from '../utils/date';
import { computeDayTotals } from '../utils/macros';

/** Comidas del día seleccionado (zona horaria local) + operaciones. */
export function useMeals(userId: string, day: Date) {
  const dayKey = toDayKey(day);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      setLoadError(null);
      try {
        const { start, end } = dayBoundsISO(parseDayKey(dayKey));
        const data = await fetchMealsBetween(start, end);
        if (id === requestId.current) setMeals(data);
      } catch (e) {
        if (id === requestId.current) setLoadError(e);
      } finally {
        if (id === requestId.current && !silent) setLoading(false);
      }
    },
    [dayKey],
  );

  useEffect(() => {
    setMeals([]);
    void load();
  }, [load, userId]);

  const addMeal = useCallback(
    async (input: NewMealInput) => {
      await createMeal(input);
      await load(true);
    },
    [load],
  );

  const removeMeal = useCallback(async (id: string) => {
    setBusyIds((b) => [...b, id]);
    try {
      await deleteMeal(id);
      setMeals((m) => m.filter((x) => x.id !== id));
    } finally {
      setBusyIds((b) => b.filter((x) => x !== id));
    }
  }, []);

  const clearDay = useCallback(async () => {
    setClearing(true);
    try {
      const { start, end } = dayBoundsISO(parseDayKey(dayKey));
      await deleteMealsBetween(start, end);
      setMeals([]);
    } finally {
      setClearing(false);
    }
  }, [dayKey]);

  const totals = useMemo(() => computeDayTotals(meals), [meals]);

  return { meals, totals, loading, loadError, busyIds, clearing, reload: () => load(), addMeal, removeMeal, clearDay };
}
