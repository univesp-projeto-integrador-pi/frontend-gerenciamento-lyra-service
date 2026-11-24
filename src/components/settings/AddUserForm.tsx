import { useRef, useState } from 'react';
import { AuthError } from '../../auth/AuthService';
import { ApiError } from '../../api/ApiClient';
import { validateUserInput } from '../../users/ApiUserService';
import type { CreateUserInput, UserRole, UserService } from '../../users/UserService';
import { USER_ROLES } from '../../users/UserService';
import { roleLabels, RolePermissions, SelectionBox } from './RolePermissions';
import { SettingsIcon } from './SettingsIcon';
const descriptions: Record<UserRole, string> = { ADMIN: 'Acesso total e gestão dos usuários.', GESTOR: 'Gerencia obras e consulta a equipe.', FUNCIONARIO: 'Acesso aos próprios dados e obras alocadas.' };
export function AddUserForm({ service, onCreated, onCancel, onForbidden }: { service: UserService; onCreated(): void; onCancel(): void; onForbidden(): void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('GESTOR');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    const input: CreateUserInput = { papel: role, senhaTemporaria: password };
    if (email.trim()) input.email = email.trim();
    if (employeeId.trim()) input.funcionarioId = Number(employeeId);
    const problems = validateUserInput(input);
    setErrors(problems); setError('');
    if (Object.keys(problems).length) return;
    submitting.current = true; setBusy(true);
    try {
      await service.create(input);
      setPassword(''); setName(''); setEmail(''); setEmployeeId('');
      onCreated();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setError(cause.message);
      else setError(cause instanceof AuthError ? cause.message : 'Não foi possível cadastrar o usuário. Tente novamente.');
      if (cause instanceof ApiError && cause.status === 403) onForbidden();
    } finally { setBusy(false); submitting.current = false; }
  }
  const fieldError = (field: string) => errors[field] ? <p id={'user-error-' + field} className="text-xs text-[#c33d3d]">{errors[field]}</p> : null;
  return <form noValidate className="flex flex-col gap-6" aria-busy={busy} onSubmit={event => { event.preventDefault(); void submit(); }}>
    <section className="settings-panel">
      <div className="flex flex-col gap-1"><h2 className="text-lg font-bold">Dados de acesso</h2><p className="text-[13px] text-muted">Usuários têm login no sistema e não precisam ser funcionários cadastrados.</p></div>
      <div className="grid grid-cols-2 gap-5">
        <label className="settings-field">Nome <input aria-label="Nome" className="settings-input" value={name} maxLength={120} onChange={event => setName(event.target.value)} disabled={busy} placeholder="Nome para referência" aria-describedby="user-name-hint" /><span id="user-name-hint" className="text-xs font-normal text-muted">Somente referência neste formulário; a API não salva nome de usuário.</span></label>
        <label className="settings-field">E-mail {employeeId ? '' : '*'}<input aria-label="E-mail" className="settings-input" type="email" autoComplete="off" value={email} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, email: '' })); setError(''); }} disabled={busy} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'user-error-email' : undefined} placeholder="email@empresa.com" />{fieldError('email')}</label>
      </div>
      <fieldset className="flex flex-col gap-5" disabled={busy}><legend className="mb-5 text-sm font-bold">Papel de acesso *</legend><div className="grid grid-cols-3 gap-5">{USER_ROLES.map(papel => <label key={papel} className={`relative flex cursor-pointer flex-col gap-2 rounded-[10px] border p-4 ${role === papel ? 'border-primary bg-[#e8f2fc]' : 'border-[#dce4ed] bg-white'}`}>
        <input className="peer sr-only" type="radio" name="papel" value={papel} checked={role === papel} onChange={() => setRole(papel)} /><span className="flex items-center gap-[9px] text-[13px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary"><SelectionBox selected={role === papel} />{roleLabels[papel]}</span><span className="text-xs text-muted">{descriptions[papel]}</span>
      </label>)}</div>{fieldError('papel')}</fieldset>
      <div className="grid grid-cols-2 gap-5">
        <label className="settings-field">Senha temporária *<input aria-label="Senha temporária *" className="settings-input" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password} onChange={event => { setPassword(event.target.value); setErrors(current => ({ ...current, senhaTemporaria: '' })); setError(''); }} disabled={busy} aria-invalid={Boolean(errors.senhaTemporaria)} aria-describedby="user-password-hint user-error-senhaTemporaria" /><span id="user-password-hint" className="text-xs font-normal text-muted">De 10 a 128 caracteres. A troca será obrigatória no primeiro acesso.</span>{fieldError('senhaTemporaria')}</label>
        <label className="settings-field">ID do funcionário (opcional)<input aria-label="ID do funcionário (opcional)" className="settings-input" type="number" min={1} step={1} value={employeeId} onChange={event => { setEmployeeId(event.target.value); setErrors(current => ({ ...current, email: '', funcionarioId: '' })); setError(''); }} disabled={busy} aria-invalid={Boolean(errors.funcionarioId)} aria-describedby="user-employee-hint user-error-funcionarioId" /><span id="user-employee-hint" className="text-xs font-normal text-muted">Se vinculado, o e-mail pode ser obtido do cadastro do funcionário.</span>{fieldError('funcionarioId')}</label>
      </div>
    </section>
    <RolePermissions role={role}>
      {error && <p role="alert" className="text-[13px] text-[#c33d3d]">{error}</p>}
      <div className="flex items-center gap-3 border-t border-[#e8edf3] pt-5"><p className="flex-1 text-xs text-muted">Compartilhe a senha temporária por um canal seguro. A API não envia convites por e-mail.</p><button type="button" disabled={busy} onClick={onCancel} className="settings-button">Cancelar</button><button disabled={busy} className="settings-button bg-primary! text-white! border-primary!"><SettingsIcon name="imgCheck" />{busy ? 'Cadastrando…' : 'Cadastrar usuário'}</button></div>
    </RolePermissions>
  </form>;
}
