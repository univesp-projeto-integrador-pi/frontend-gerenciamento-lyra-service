import type { UserRole } from '../../users/UserService';
import type { ReactNode } from 'react';
import { SettingsIcon } from './SettingsIcon';
export const roleLabels: Record<UserRole, string> = { ADMIN: 'Administrador', GESTOR: 'Gestor', FUNCIONARIO: 'Funcionário' };
const pages = ['Visão Geral', 'Funcionários', 'Obras', 'Documentos', 'Configurações'];
function permissions(role: UserRole, page: string): boolean[] | null {
  if (page === 'Documentos') return null;
  if (page === 'Visão Geral') return [true, false, false, false];
  if (page === 'Configurações') return Array(4).fill(role === 'ADMIN');
  if (page === 'Funcionários') return [true, role === 'ADMIN', role === 'ADMIN', role === 'ADMIN'];
  return [true, role !== 'FUNCIONARIO', role !== 'FUNCIONARIO', role !== 'FUNCIONARIO'];
}
export function SelectionBox({ selected }: { selected: boolean }) {
  return <span aria-hidden="true" className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border text-xs font-bold ${selected ? 'border-primary bg-primary text-white' : 'border-[#dce4ed] bg-white'}`}>{selected ? '✓' : ''}</span>;
}
export function RolePermissions({ role, children }: { role: UserRole; children: ReactNode }) {
  return <section className="settings-panel">
    <div className="flex flex-col gap-1"><h2 className="text-lg font-bold">Permissões por página</h2><p className="text-[13px] text-muted">Papel selecionado: {roleLabels[role]} · permissões definidas pelo backend, sem personalização por página.</p></div>
    <div className="overflow-x-auto rounded-[10px] border border-[#dce4ed]" role="table" aria-label="Referência das permissões do papel">
      <div role="row" className="permission-columns bg-[#f5f7fa] px-[18px] py-[13px] text-xs font-semibold text-muted">{['Página', 'Visualizar', 'Criar', 'Editar', 'Inativar'].map(label => <span role="columnheader" key={label}>{label}</span>)}</div>
      {pages.map(page => { const allowed = permissions(role, page); return <div role="row" key={page} className="permission-columns items-center border-b border-[#e8edf3] px-[18px] py-[17px] last:border-b-0"><span role="cell" className="text-[13px] font-semibold">{page}</span>{[0, 1, 2, 3].map(index => <span role="cell" key={index} aria-label={allowed ? allowed[index] ? 'Permitido conforme escopo da API' : 'Não permitido' : 'Não disponível na API'}>{allowed ? <SelectionBox selected={allowed[index]} /> : <span className="text-xs text-muted">—</span>}</span>)}</div>; })}
    </div>
    <div className="flex items-start gap-2.5 rounded-[8px] bg-[#e8f2fc] p-[14px]"><SettingsIcon name="imgInfo" /><p className="text-[13px] text-[#073e75]">Somente Administrador gerencia usuários. Permissões são fixas por papel e sujeitas ao escopo do backend. Documentos não possui API; “Inativar” não é exclusão lógica. As marcações são informativas e não serão enviadas.</p></div>
    {children}
  </section>;
}
