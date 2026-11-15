interface ErrorLike {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
}

const asErr = (e: unknown): ErrorLike => (e && typeof e === 'object' ? (e as ErrorLike) : {});

export function isSessionExpired(e: unknown): boolean {
  const { message = '', status, code } = asErr(e);
  return (
    status === 401 ||
    code === 'PGRST301' ||
    code === '28000' ||
    /jwt expired|not_authenticated|invalid jwt|refresh token/i.test(message)
  );
}

export function isNetworkError(e: unknown): boolean {
  const { message = '', name } = asErr(e);
  return /failed to fetch|networkerror|network request failed|load failed/i.test(message) ||
    name === 'FunctionsFetchError';
}

/** Traduce errores técnicos (Supabase / red) a mensajes comprensibles. */
export function friendlyError(e: unknown, fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.'): string {
  const { message = '' } = asErr(e);
  if (isNetworkError(e)) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  if (isSessionExpired(e)) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(message)) return 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada).';
  if (/user already registered/i.test(message)) return 'Ya existe una cuenta con ese correo.';
  if (/password should be at least/i.test(message)) return 'La contraseña es demasiado corta.';
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(message)) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }
  if (/same password/i.test(message)) return 'La nueva contraseña debe ser distinta a la anterior.';
  return fallback;
}
