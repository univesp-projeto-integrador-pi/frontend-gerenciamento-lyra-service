import { Presentation } from './components/Presentation';
import { LoginForm } from './components/LoginForm';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './components/home/Home';
import { Works } from './components/works/Works';
import { Employees } from './components/employees/Employees';
import { Documents } from './components/docs/Documents';
import { Equipment } from './components/epi/Equipment';
import { ProtectedRoute, GuestRoute } from './auth/ProtectedRoute';
import { AdminRoute } from './auth/AdminRoute';
import { ChangePassword } from './auth/ChangePassword';
import { UsersSettings } from './components/settings/UsersSettings';
import { WorkForm } from './components/works/WorkForm';
import { WorkDetails } from './components/works/WorkDetails';
import { InactiveWorks } from './components/works/InactiveWorks';
import { EmployeeForm } from './components/employees/EmployeeForm';
import { EmployeeDetails } from './components/employees/EmployeeDetails';
import { InactiveEmployees } from './components/employees/InactiveEmployees';
import { DocumentForm } from './components/docs/DocumentForm';
import { AllocationForm } from './components/works/AllocationForm';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { AuditSettings } from './components/settings/AuditSettings';
import { RoleRoute } from './auth/RoleRoute';
import { EmployeeAccessRoute } from './auth/EmployeeAccessRoute';
import { useEffect, useState } from 'react';
export default function App() {
  const [auditWarning, setAuditWarning] = useState(false);
  useEffect(() => { const warn = () => setAuditWarning(true); window.addEventListener('lyra:audit-unavailable', warn); return () => window.removeEventListener('lyra:audit-unavailable', warn); }, []);
  return <BrowserRouter>{auditWarning && <p role="alert" className="bg-[#fff3dc] p-3 text-sm">O registro foi salvo, mas não foi possível gravar o evento no histórico local. <button onClick={() => setAuditWarning(false)}>Fechar</button></p>}<Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route element={<GuestRoute />}><Route path="/login" element={<Login />} /></Route>
    <Route path="/alterar-senha" element={<ChangePassword />} />
    <Route element={<ProtectedRoute />}>
    <Route path="/home" element={<Home />} />
    <Route path="/obras" element={<Works />} />
    <Route element={<RoleRoute roles={['ADMIN', 'GESTOR']} />}><Route path="/funcionarios" element={<Employees />} /><Route path="/funcionarios/inativos" element={<InactiveEmployees />} /></Route>
    <Route path="/docs" element={<Documents />} />
    <Route path="/epi" element={<Equipment />} />
    <Route path="/obras/inativas" element={<InactiveWorks />} />
    <Route path="/obras/:id" element={<WorkDetails />} />
    <Route path="/funcionarios/:id" element={<EmployeeAccessRoute />}><Route index element={<EmployeeDetails />} /><Route path=":tab" element={<EmployeeDetails />} /></Route>
    <Route path="/configuracoes/perfil" element={<ProfileSettings />} />
    <Route element={<RoleRoute roles={['ADMIN', 'GESTOR']} />}>
      <Route path="/obras/nova" element={<WorkForm />} />
      <Route path="/obras/:id/editar" element={<WorkForm />} />
      <Route path="/docs/novo" element={<DocumentForm />} />
      <Route path="/alocacoes/nova" element={<AllocationForm />} />
    </Route>
    <Route element={<AdminRoute />}><Route path="/configuracoes/usuarios" element={<UsersSettings />} /><Route path="/configuracoes/historico" element={<AuditSettings />} /><Route path="/funcionarios/novo" element={<EmployeeForm />} /><Route path="/funcionarios/:id/editar" element={<EmployeeForm />} /></Route>
    </Route>
  </Routes></BrowserRouter>;
}
function Login() {
  return <main className="login-page flex bg-white">
    <Presentation />
    <section className="access relative flex min-w-0 flex-1 items-center justify-center bg-white">
      <LoginForm />
      <p className="support absolute text-[13px] leading-normal text-muted">Precisa de ajuda? <button type="button" className="font-semibold text-primary">Falar com o suporte</button></p>
    </section>
  </main>;
}
