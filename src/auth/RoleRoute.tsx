import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../users/UserService';
export function RoleRoute({ roles }: { roles: UserRole[] }) { const { user } = useAuth(); return user && roles.includes(user.papel) ? <Outlet /> : <Navigate to="/home" replace />; }
export function usePermissions() { const { user } = useAuth(); return { manageEmployees: user?.papel === 'ADMIN', manageWorks: user?.papel === 'ADMIN' || user?.papel === 'GESTOR', manageUsers: user?.papel === 'ADMIN', manageDocuments: import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'local' && import.meta.env.VITE_AUTH_MODE === 'mock' && (user?.papel === 'ADMIN' || user?.papel === 'GESTOR') }; }
