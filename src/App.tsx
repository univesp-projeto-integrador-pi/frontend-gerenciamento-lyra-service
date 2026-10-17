import { Presentation } from './components/Presentation';
import { LoginForm } from './components/LoginForm';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './components/home/Home';
import { Works } from './components/works/Works';
import { Employees } from './components/employees/Employees';
import { Documents } from './components/docs/Documents';
import { Equipment } from './components/epi/Equipment';
import { ProtectedRoute, GuestRoute } from './auth/ProtectedRoute';
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route element={<GuestRoute />}><Route path="/login" element={<Login />} /></Route>
    <Route element={<ProtectedRoute />}>
    <Route path="/home" element={<Home />} />
    <Route path="/obras" element={<Works />} />
    <Route path="/funcionarios" element={<Employees />} />
    <Route path="/docs" element={<Documents />} />
    <Route path="/epi" element={<Equipment />} />
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
