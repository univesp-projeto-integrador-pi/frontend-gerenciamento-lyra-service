import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export function AdminRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.papel === 'ADMIN' ? <Outlet /> : <Navigate to="/home" replace />;
}
