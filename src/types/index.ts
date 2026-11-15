export const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type MealSource = 'text' | 'voice' | 'voice_simulated' | 'quick_example';
export type NutritionEngine = 'gemini' | 'fallback';

export interface FoodItemInput {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem extends FoodItemInput {
  id: string;
}

export interface AnalysisResult {
  items: FoodItemInput[];
  tip: string;
}

export interface AnalysisOutcome {
  result: AnalysisResult;
  engine: NutritionEngine;
  /** Motivo legible por el que se usó el motor de respaldo. */
  fallbackReason?: string;
}

export interface Meal {
  id: string;
  mealType: MealType;
  description: string;
  source: MealSource;
  engine: NutritionEngine;
  tip: string;
  consumedAt: string;
  items: FoodItem[];
}

export interface NewMealInput {
  mealType: MealType;
  description: string;
  source: MealSource;
  engine: NutritionEngine;
  tip: string;
  consumedAt: Date;
  items: FoodItemInput[];
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
