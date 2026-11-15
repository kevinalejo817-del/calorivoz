// Edge Function: analyze-meal
// Llama a Gemini con la clave guardada como secreto (GEMINI_API_KEY).
// Requiere un usuario autenticado de Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];
const MAX_DESCRIPTION = 600;
const MAX_RETRIES = 2;
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3-flash-preview';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clampNumber(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(Math.min(n, max) * 10) / 10;
}

// Valida y normaliza la respuesta de Gemini antes de devolverla.
function sanitize(raw: unknown): { items: unknown[]; tip: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.items) || obj.items.length === 0 || obj.items.length > 25) return null;
  const items = [];
  for (const it of obj.items) {
    if (!it || typeof it !== 'object') return null;
    const r = it as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim().slice(0, 200) : '';
    const portion = typeof r.portion === 'string' ? r.portion.trim().slice(0, 200) : '';
    const calories = clampNumber(r.calories, 5000);
    const protein = clampNumber(r.protein, 500);
    const carbs = clampNumber(r.carbs, 1000);
    const fat = clampNumber(r.fat, 500);
    if (!name || !portion || calories === null || protein === null || carbs === null || fat === null) {
      return null;
    }
    items.push({ name, portion, calories, protein, carbs, fat });
  }
  const tip = typeof obj.tip === 'string' ? obj.tip.trim().slice(0, 500) : '';
  return { items, tip };
}

async function callGemini(apiKey: string, description: string, mealType: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const payload = {
    contents: [{
      parts: [{
        text:
          `Analiza la siguiente comida descrita en español y desglósala en sus alimentos individuales con porciones estimadas y valores nutricionales realistas (calorías en kcal, proteínas en gramos, carbohidratos en gramos y grasas en gramos). Incluye además un consejo nutricional breve, positivo y práctico en español.\n\nMomento del día: ${mealType}\nComida descrita: "${description}"`,
      }],
    }],
    systemInstruction: {
      parts: [{
        text:
          'Eres un nutricionista clínico experto en gastronomía hispana e internacional. Devuelve siempre un JSON válido que cumpla estrictamente el esquema indicado. Si el usuario no especifica cantidades exactas, estima porciones estándar realistas.',
      }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                portion: { type: 'STRING' },
                calories: { type: 'NUMBER' },
                protein: { type: 'NUMBER' },
                carbs: { type: 'NUMBER' },
                fat: { type: 'NUMBER' },
              },
              required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat'],
            },
          },
          tip: { type: 'STRING' },
        },
        required: ['items', 'tip'],
      },
    },
  };

  let delay = 1000;
  let lastStatus = 0;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
      if (res.ok) return { ok: true as const, data: await res.json() };
      const transient = res.status === 429 || res.status >= 500;
      if (!transient) return { ok: false as const, status: res.status };
      if (attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 8000)
          : delay;
        await sleep(wait);
        delay *= 2;
      }
    } catch (_err) {
      lastStatus = 0;
      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 2;
      }
    }
  }
  return { ok: false as const, status: lastStatus };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // 1) Solo usuarios autenticados (la anon key por sí sola no basta).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);

  // 2) Secreto del backend.
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'gemini_not_configured' }, 503);

  // 3) Validar entrada.
  let body: { description?: unknown; mealType?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const mealType = typeof body.mealType === 'string' ? body.mealType : '';
  if (!description || description.length > MAX_DESCRIPTION) {
    return json({ error: 'invalid_description' }, 400);
  }
  if (!MEAL_TYPES.includes(mealType)) return json({ error: 'invalid_meal_type' }, 400);

  // 4) Gemini con reintentos.
  const result = await callGemini(apiKey, description, mealType);
  if (!result.ok) {
    if (result.status === 429) return json({ error: 'rate_limited' }, 429);
    return json({ error: 'gemini_unavailable', status: result.status }, 502);
  }

  const rawText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof rawText !== 'string' || !rawText) return json({ error: 'empty_response' }, 502);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.replace(/^```json\s*|\s*```$/g, '').trim());
  } catch {
    return json({ error: 'invalid_model_output' }, 502);
  }
  const clean = sanitize(parsed);
  if (!clean) return json({ error: 'invalid_model_output' }, 502);

  return json(clean);
});
