import { useState } from 'react';
import { Icon } from './Icon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../auth/AuthService';
export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  async function submit() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/home', { replace: true });
    } catch (cause) {
      setError(cause instanceof AuthError ? cause.message : 'Não foi possível entrar. Tente novamente.');
    } finally { setLoading(false); }
  }
  return <form noValidate aria-busy={loading} className="flex w-[420px] max-w-full flex-col gap-6" onSubmit={event => { event.preventDefault(); void submit(); }}>
    <div className="flex flex-col gap-2 leading-[1.45]">
      <h2 className="text-[32px] font-bold text-ink">Acesse sua conta</h2>
      <p className="text-base text-muted">Entre com seus dados corporativos.</p>
    </div>
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2"><label htmlFor="email" className="text-[13px] font-semibold leading-[1.45] text-ink">E-mail</label>
        <div className="credential"><Icon name="mail" /><input id="email" type="email" autoComplete="username" placeholder="marina@construtoraviva.com.br" value={email} disabled={loading} onChange={event => { setEmail(event.target.value); setError(null); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} /></div>
      </div>
      <div className="flex flex-col gap-2"><label htmlFor="password" className="text-[13px] font-semibold leading-[1.45] text-ink">Senha</label>
        <div className="credential"><Icon name="lock" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} disabled={loading} onChange={event => { setPassword(event.target.value); setError(null); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}><Icon name="eye-off" /></button></div>
      </div>
      <button type="button" className="w-full text-right text-[13px] font-semibold leading-[1.45] text-primary">Esqueci minha senha</button>
    </div>
    {error && <p id="login-error" role="alert" className="text-[13px] leading-[1.45] text-[#c33d3d]">{error}</p>}
    <button type="submit" disabled={loading} className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[10px] bg-primary text-base font-semibold leading-[1.45] text-white disabled:cursor-wait disabled:opacity-75"><Icon name="login" />{loading ? 'Entrando…' : 'Entrar'}</button>
    <p className="flex items-center justify-center gap-2 text-xs leading-[1.45] text-muted"><Icon name="secure" />Acesso protegido e dados criptografados</p>
  </form>;
}
