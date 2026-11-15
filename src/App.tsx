import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/Auth/RouteGuards';
import { AuthLayout } from './components/Auth/AuthLayout';
import { isSupabaseConfigured } from './services/supabase/client';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function ConfigMissing() {
  return (
    <AuthLayout title="Falta conectar Supabase" subtitle="Define las variables de entorno y reinicia la app.">
      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 overflow-x-auto text-slate-700">
{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key`}
      </pre>
      <p className="text-sm text-slate-500 mt-3">Copia <code>.env.example</code> a <code>.env</code> y consulta el README.</p>
    </AuthLayout>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
