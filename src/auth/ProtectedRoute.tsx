import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export function GuestRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Navigate to="/home" replace /> : <Outlet />;
}
