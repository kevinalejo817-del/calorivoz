import type { AnalysisOutcome, MealType } from '../../types';
import { supabase } from '../supabase/client';
import { analyzeWithLocalEngine } from './localEngine';
import { validateAnalysis } from './validate';

async function describeFailure(err: unknown): Promise<string> {
  const ctx = (err as { context?: unknown } | null)?.context;
  if (ctx instanceof Response) {
    try {
      const body = (await ctx.clone().json()) as { error?: string };
      if (body.error === 'rate_limited') return 'Gemini alcanzó su límite de solicitudes.';
      if (body.error === 'gemini_not_configured') return 'Gemini no está configurado en el servidor.';
      if (body.error === 'unauthorized') return 'No se pudo autorizar el análisis con IA.';
    } catch {
      /* cuerpo no JSON */
    }
  }
  return 'Gemini no está disponible en este momento.';
}

/**
 * Analiza la comida con Gemini (Edge Function). Si falla por cualquier motivo,
 * usa el motor local y lo indica en el resultado (engine = 'fallback').
 */
export async function analyzeMeal(description: string, mealType: MealType): Promise<AnalysisOutcome> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-meal', {
      body: { description, mealType },
    });
    if (error) throw error;
    const result = validateAnalysis(data);
    if (!result) throw new Error('invalid_response');
    return { result, engine: 'gemini' };
  } catch (err) {
    const fallbackReason = await describeFailure(err);
    return { result: analyzeWithLocalEngine(description), engine: 'fallback', fallbackReason };
  }
}
