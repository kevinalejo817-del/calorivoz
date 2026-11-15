import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Field, FormMessage, PrimaryButton } from '../components/Auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { friendlyError } from '../utils/errors';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresa un correo válido.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) {
        setNotice('Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve para iniciar sesión.');
      }
      // Sin confirmación requerida: la sesión se crea y PublicOnlyRoute redirige al panel.
    } catch (err) {
      setError(friendlyError(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Cada cuenta tiene su propio historial y su propia meta diaria."
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Inicia sesión</Link></>}
    >
      {notice ? (
        <FormMessage kind="success">{notice}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Correo electrónico" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          <Field label="Contraseña" id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          <Field label="Repite la contraseña" id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <PrimaryButton type="submit" loading={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
}
