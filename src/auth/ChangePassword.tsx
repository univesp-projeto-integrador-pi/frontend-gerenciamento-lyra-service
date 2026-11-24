import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AuthError } from './AuthService';
export function ChangePassword() {
  const { user, initializing, changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fields = [
    { value: current, setValue: setCurrent, label: 'Senha provisória', autocomplete: 'current-password' },
    { value: next, setValue: setNext, label: 'Nova senha', autocomplete: 'new-password' },
    { value: confirmation, setValue: setConfirmation, label: 'Confirme a nova senha', autocomplete: 'new-password' },
  ];
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.precisaTrocarSenha) return <Navigate to="/home" replace />;
  async function submit() {
    if (busy) return;
    if (!current || next.length < 10 || next.length > 128 || next === current || next !== confirmation) { setError('Informe a senha atual e confirme uma nova senha diferente, com 10 a 128 caracteres.'); return; }
    setBusy(true); setError('');
    try { await changePassword(current, next); setCurrent(''); setNext(''); setConfirmation(''); }
    catch (cause) { setError(cause instanceof AuthError ? cause.message : 'Não foi possível trocar a senha. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-8 text-ink"><form className="flex w-[420px] flex-col gap-6 rounded-[14px] border border-[#dce4ed] bg-white p-8" onSubmit={event => { event.preventDefault(); void submit(); }}>
    <div><h1 className="text-[28px] font-bold">Troque sua senha provisória</h1><p className="mt-2 text-sm text-muted">Defina sua senha pessoal antes de acessar o sistema.</p></div>
    {fields.map(field => <label key={field.label} className="flex flex-col gap-2 text-[13px] font-semibold">{field.label}<input type="password" autoComplete={field.autocomplete} maxLength={128} required disabled={busy} value={field.value} onChange={event => field.setValue(event.target.value)} className="settings-input" /></label>)}
    {error && <p role="alert" className="text-[13px] text-[#c33d3d]">{error}</p>}
    <button disabled={busy} className="h-11 rounded-[10px] bg-primary text-sm font-semibold text-white">{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
    <button type="button" disabled={busy} className="text-[13px] font-semibold text-primary" onClick={() => { void logout().catch(() => setError('Não foi possível sair. Tente novamente.')); }}>Sair</button>
  </form></main>;
}
