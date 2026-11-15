import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Field, FormMessage, PrimaryButton } from '../components/Auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { friendlyError } from '../utils/errors';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err, 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Accede a tu registro de calorías y macronutrientes."
      footer={<>¿Aún no tienes cuenta? <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">Crear cuenta</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Correo electrónico" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
        <Field label="Contraseña" id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <PrimaryButton type="submit" loading={loading}>{loading ? 'Entrando...' : 'Iniciar sesión'}</PrimaryButton>
        <div className="text-center">
          <Link to="/forgot-password" className="text-sm font-medium text-slate-500 hover:text-emerald-700">¿Olvidaste tu contraseña?</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
