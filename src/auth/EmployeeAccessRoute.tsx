import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
export function EmployeeAccessRoute() { const { user } = useAuth(); const { id } = useParams(); return user?.papel !== 'FUNCIONARIO' || String(user.funcionarioId) === id ? <Outlet /> : <Navigate to="/home" replace />; }
