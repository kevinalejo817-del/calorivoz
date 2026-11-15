import type { FoodItem, Meal, MealSource, MealType, NewMealInput, NutritionEngine } from '../../types';
import { supabase } from './client';

interface MealItemRow {
  id: string;
  name: string;
  portion: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  sort_order: number;
}

interface MealRow {
  id: string;
  meal_type: MealType;
  description: string;
  source: MealSource;
  engine: NutritionEngine;
  tip: string | null;
  consumed_at: string;
  meal_items: MealItemRow[] | null;
}

function mapMeal(row: MealRow): Meal {
  const items: FoodItem[] = (row.meal_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      name: i.name,
      portion: i.portion,
      calories: Number(i.calories),
      protein: Number(i.protein),
      carbs: Number(i.carbs),
      fat: Number(i.fat),
    }));
  return {
    id: row.id,
    mealType: row.meal_type,
    description: row.description,
    source: row.source,
    engine: row.engine,
    tip: row.tip ?? '',
    consumedAt: row.consumed_at,
    items,
  };
}

/** Comidas con consumed_at en [start, end), más recientes primero. */
export async function fetchMealsBetween(startISO: string, endISO: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select(
      'id, meal_type, description, source, engine, tip, consumed_at, meal_items(id, name, portion, calories, protein, carbs, fat, sort_order)',
    )
    .gte('consumed_at', startISO)
    .lt('consumed_at', endISO)
    .order('consumed_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as MealRow[]).map(mapMeal);
}

/** Guarda comida + alimentos en una sola transacción (RPC). */
export async function createMeal(input: NewMealInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_meal_with_items', {
    p_meal_type: input.mealType,
    p_description: input.description,
    p_source: input.source,
    p_engine: input.engine,
    p_tip: input.tip,
    p_consumed_at: input.consumedAt.toISOString(),
    p_items: input.items,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}

/** Borra todas las comidas del rango (los alimentos caen por ON DELETE CASCADE). */
export async function deleteMealsBetween(startISO: string, endISO: string): Promise<void> {
  const { error } = await supabase
    .from('meals')
    .delete()
    .gte('consumed_at', startISO)
    .lt('consumed_at', endISO);
  if (error) throw error;
}
