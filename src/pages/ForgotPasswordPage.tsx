import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Field, FormMessage, PrimaryButton } from '../components/Auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { friendlyError } from '../utils/errors';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresa un correo válido.');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, 'No se pudo enviar el correo. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para crear una contraseña nueva."
      footer={<Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Volver a iniciar sesión</Link>}
    >
      {sent ? (
        <FormMessage kind="success">Si el correo existe, recibirás un enlace para restablecer tu contraseña.</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Correo electrónico" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <PrimaryButton type="submit" loading={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
}
