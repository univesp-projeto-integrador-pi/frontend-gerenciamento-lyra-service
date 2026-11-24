import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.precisaTrocarSenha ? <Navigate to="/alterar-senha" replace /> : <Outlet />;
}
export function GuestRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Navigate to={user.precisaTrocarSenha ? '/alterar-senha' : '/home'} replace /> : <Outlet />;
}
