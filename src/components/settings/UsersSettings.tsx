import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '../home/Sidebar';
import { HomeHeader } from '../home/HomeHeader';
import { useAuth } from '../../auth/AuthContext';
import { userService } from '../../users/createUserService';
import type { UserService, Usuario } from '../../users/UserService';
import { AuthError } from '../../auth/AuthService';
import { AddUserForm } from './AddUserForm';
import { UserList } from './UserList';
import { Link } from 'react-router-dom';
export function UsersSettings({ service = userService }: { service?: UserService }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(true);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError('');
    try { const result = await service.getAll(); if (generation.current === request) setUsers(result); }
    catch (cause) { if (generation.current === request) { setUsers([]); setError(cause instanceof AuthError ? cause.message : 'Não foi possível consultar os usuários.'); } }
    finally { if (generation.current === request) setLoading(false); }
  }, [service]);
  useEffect(() => { void refresh(); return () => { ++generation.current; }; }, [refresh]);
  return <div style={{ minHeight: adding ? 1224 : 1085 }} className="settings-screen flex min-w-[1200px] bg-[#f5f7fa] text-ink"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><HomeHeader title="Configurações" settings />
    <main className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between"><div className="flex flex-col gap-1"><h1 className="text-[28px] font-bold">{adding ? 'Adicionar usuário' : 'Configurações'}</h1><p className="text-sm text-muted">Configurações / Usuários{adding ? ' / Novo cadastro' : ''}</p></div>{!adding && <button className="settings-button bg-primary! text-white!" onClick={() => { setAdding(true); setNotice(''); }}>Adicionar usuário</button>}</div>
      <nav aria-label="Abas de configurações" className="flex border-b border-[#dce4ed]"><Link to="/configuracoes/perfil" className="settings-tab text-muted">Perfil</Link><button className="settings-tab border-b-2 border-primary font-bold text-primary" aria-current="page" onClick={() => { setAdding(false); }}>Usuários</button><Link to="/configuracoes/historico" className="settings-tab text-muted">Histórico de alterações</Link></nav>
      {notice && <p role="status" className="rounded-[8px] bg-[#e8f6f0] p-[14px] text-[13px] text-[#167a52]">{notice}</p>}
      {adding ? <AddUserForm service={service} onCreated={() => { setNotice('Usuário cadastrado. A senha temporária deverá ser trocada no primeiro acesso.'); setAdding(false); void refresh(); }} onCancel={() => { setAdding(false); }} onForbidden={() => { void refresh(); }} /> : <>
        {loading && <p role="status" className="text-sm text-muted">Carregando usuários…</p>}
        {error && <div role="alert" className="settings-panel"><p className="text-[13px] text-[#c33d3d]">{error}</p><button className="settings-button self-start" onClick={() => { void refresh(); }}>Tentar novamente</button></div>}
        <div hidden={loading || Boolean(error)}><UserList users={users} service={service} onRefresh={refresh} currentId={user?.id ?? ''} /></div>
      </>}
    </main>
  </div></div>;
}
