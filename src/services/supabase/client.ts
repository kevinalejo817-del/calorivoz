import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Si faltan variables, App muestra una pantalla de configuración en lugar de fallar.
export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
