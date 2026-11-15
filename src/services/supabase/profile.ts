import { supabase } from './client';

export const DEFAULT_GOAL = 2000;

/** Devuelve la meta diaria del usuario; crea el perfil si faltara (usuarios previos al trigger). */
export async function fetchDailyGoal(userId: string, email: string | undefined): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_goal')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.daily_goal as number;

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email ?? null, daily_goal: DEFAULT_GOAL }, { onConflict: 'id' })
    .select('daily_goal')
    .single();
  if (createError) throw createError;
  return created.daily_goal as number;
}

export async function updateDailyGoal(userId: string, goal: number): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ daily_goal: goal })
    .eq('id', userId)
    .select('daily_goal')
    .single();
  if (error) throw error;
  return data.daily_goal as number;
}
