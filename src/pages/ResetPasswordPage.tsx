import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Field, FormMessage, PrimaryButton } from '../components/Auth/AuthLayout';
import { FullScreenLoader } from '../components/Auth/RouteGuards';
import { useAuth } from '../contexts/AuthContext';
import { friendlyError } from '../utils/errors';

export default function ResetPasswordPage() {
  const { session, loading: authLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (authLoading) return <FullScreenLoader />;

  if (!session) {
    return (
      <AuthLayout
        title="Enlace no válido"
        footer={<Link to="/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">Pedir un enlace nuevo</Link>}
      >
        <FormMessage kind="error">El enlace de recuperación expiró o ya se usó.</FormMessage>
      </AuthLayout>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(friendlyError(err, 'No se pudo actualizar la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Crea una contraseña nueva" subtitle="Elige una contraseña de al menos 8 caracteres.">
      {done ? (
        <FormMessage kind="success">Contraseña actualizada. Te llevamos a tu panel...</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Contraseña nueva" id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Repite la contraseña" id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <PrimaryButton type="submit" loading={loading}>{loading ? 'Guardando...' : 'Guardar contraseña'}</PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
}
