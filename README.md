# CaloriVoz — React + Supabase

Contador inteligente de calorías por voz y texto. Frontend en React + TypeScript + Vite + Tailwind (v3, igual que el HTML original); backend en Supabase (Auth, PostgreSQL con RLS y una Edge Function para Gemini).

## 1. Instalar

```bash
npm install
cp .env.example .env      # y rellena las dos variables públicas
```

## 2. Crear el proyecto de Supabase

1. Crea un proyecto en <https://supabase.com>.
2. En **Project Settings → API** copia `Project URL` y la clave `anon public` a `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Crea las tablas, políticas RLS, triggers y la función RPC. Elige una opción:
   - **SQL Editor:** pega el contenido de `supabase/schema.sql` y pulsa *Run*.
   - **CLI:** `supabase link --project-ref TU_REF && supabase db push`.
   La migración se puede ejecutar más de una vez sin romper nada.
4. **Authentication → URL Configuration:** añade como *Site URL* la URL de tu app (`http://localhost:5173` en local) y, en *Redirect URLs*, `http://localhost:5173/reset-password` y la equivalente de producción. Sin esto el enlace de "recuperar contraseña" no funcionará.
5. (Opcional, para desarrollo) en **Authentication → Providers → Email** puedes desactivar *Confirm email* para entrar sin confirmar el correo.

## 3. Gemini (Edge Function `analyze-meal`)

La clave de Gemini **nunca** va al frontend: se guarda como secreto de la función.

```bash
npm i -g supabase                         # o usa npx supabase
supabase login
supabase link --project-ref TU_REF
supabase secrets set GEMINI_API_KEY=tu_clave_de_gemini
# opcional: supabase secrets set GEMINI_MODEL=nombre-del-modelo
supabase functions deploy analyze-meal
```

- Modelo por defecto: `gemini-3-flash-preview` (el del código original). Si tu clave no tiene acceso a ese modelo, define `GEMINI_MODEL` con otro modelo disponible.
- La función exige un usuario autenticado, valida la entrada, reintenta ante 429/5xx (con `Retry-After` si lo hay) y valida el JSON antes de devolverlo.
- Si Gemini falla (sin clave, límite de solicitudes, caída), la app usa el **motor local de respaldo**, lo avisa con un toast y marca la comida con la etiqueta "Estimación de respaldo".

## 4. Ejecutar

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de producción en dist/
npm test           # pruebas unitarias (motor local, validación, totales, fechas)
```

## 5. Desplegar

Es una SPA estática. En Vercel (`vercel.json`) o Netlify (`public/_redirects`) ya están las reglas de reescritura a `index.html`.
Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel del proveedor, despliega, y añade la URL final en *Authentication → URL Configuration* de Supabase.

## Estructura

```
src/
  components/  Header, Dashboard (DailySummary), MealForm, MealHistory, GoalModal, Toast, Auth
  pages/       Login, Register, ForgotPassword, ResetPassword, Dashboard
  hooks/       useMeals, useProfile, useSpeech, useToday
  contexts/    AuthContext, ToastContext
  services/    supabase/ (client, profile, meals), nutrition/ (analyze, localEngine, foodDb, validate)
  utils/       date (zona horaria local), macros, errors
supabase/
  migrations/  esquema, RLS, triggers, RPC create_meal_with_items
  functions/   analyze-meal (Gemini)
  tests/       rls_test.sql (+ stub para PostgreSQL local)
```

## Modelo de datos

- `profiles` (1:1 con `auth.users`; `daily_goal` 800–8000, por defecto 2000; creado por trigger al registrarse).
- `meals` (por usuario; `meal_type`, `source`, `engine`, `consumed_at`…).
- `meal_items` (alimentos de cada comida; `ON DELETE CASCADE`).
- RLS en las tres tablas: cada usuario solo accede a lo suyo. `anon` no tiene acceso.
- `create_meal_with_items(...)` inserta comida y alimentos en **una transacción** (`SECURITY INVOKER`, así que RLS se aplica).
- Los días se consultan con límites `[00:00, 24:00)` de la zona horaria **local** del navegador, convertidos a UTC.

## Cambios respecto al HTML original (todos mínimos y necesarios)

- **Cerrar sesión:** botón de icono junto a la meta en la cabecera.
- **Navegación por día:** flechas y botón "Hoy" en el historial para consultar días anteriores (requisito de historial por fecha). Al registrar en otro día, la comida se guarda en ese día.
- **Confirmación al eliminar una comida:** mismo patrón "¿Eliminar? Sí / No" que el de "Limpiar día".
- **Etiqueta "Estimación de respaldo"** en comidas calculadas sin Gemini.
- **Comida de ejemplo inicial eliminada:** el original precargaba un desayuno ficticio; aquí el historial empieza vacío para no mezclar datos de demostración con datos reales.
- **Meta:** validación 800–8000 (el `max` del input original era 6000, pero su validación JS permitía 8000).
- **Motor local:** "café con leche" ya no se parte por la palabra "con", y si alguna parte de la descripción no se reconoce se avisa en el consejo en lugar de ignorarse en silencio.
- Columnas añadidas a las pedidas: `meals.engine` y `meal_items.sort_order` (orden estable de los alimentos).

## Lista de comprobación manual (requiere tu proyecto de Supabase)

1. Registrarte → entrar → comprobar en *Table Editor* que existe tu fila en `profiles` con meta 2000.
2. Registrar una comida por texto → aparece en `meals` y sus alimentos en `meal_items`; el dashboard suma bien.
3. Recargar la página → los datos siguen ahí.
4. Cambiar la meta → recargar → persiste.
5. Eliminar una comida y "Limpiar día" → los totales bajan y las filas desaparecen.
6. Crear un segundo usuario → no ve nada del primero.
7. Con `GEMINI_API_KEY` configurada → las comidas no llevan la etiqueta de respaldo. Sin ella (o con una inválida) → aparece el aviso y la etiqueta.
8. Probar en el móvil y en escritorio; el micrófono requiere HTTPS (o localhost) y Chrome/Edge/Safari. En Firefox se muestra el aviso y el simulador de dictado.
