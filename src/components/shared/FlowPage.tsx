import { useEffect, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from '../home/Sidebar';
import { HomeHeader } from '../home/HomeHeader';
import { FlowIcon } from './FlowIcon';
import { useData } from '../../data/DataContext';
import type { DataServices } from '../../data/createDataServices';
import type { RecordService } from '../../data/RecordService';
import { useAuth } from '../../auth/AuthContext';
export function FlowPage({ area, title, subtitle, action, children, height = 1000 }: { area: string; title: string; subtitle?: string; action?: ReactNode; children: ReactNode; height?: number }) {
  const { state } = useLocation(); const notice = state && typeof state.notice === 'string' ? state.notice : undefined;
  return <div className="flow-screen flex min-w-[1200px] bg-[#f5f7fa] text-ink" style={{ minHeight: height }}><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><HomeHeader title={area} settings /><main className="flex flex-col gap-6 p-8"><div className="flex items-center justify-between gap-5"><div><h1 className="text-[28px] font-bold leading-[1.45]">{title}</h1>{subtitle && <p className="mt-1 text-sm leading-[1.45] text-muted">{subtitle}</p>}</div>{action}</div><Message notice={notice} />{children}</main></div></div>;
}
export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) { return <section className={`flow-panel ${className}`}>{title && <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold leading-[1.45]">{title}</h2>{description && <p className="mt-1 text-[13px] leading-[1.45] text-muted">{description}</p>}</div>{action}</div>}{children}</section>; }
export function Steps({ labels, current }: { labels: string[]; current: number }) { return <ol aria-label="Etapas do cadastro" className="flex h-[70px] items-center gap-6 rounded-[14px] border border-[#dce4ed] bg-white px-6">{labels.map((label, index) => <li key={label} aria-current={current === index ? 'step' : undefined} className="flex min-w-0 flex-1 items-center gap-2.5"><span className={`flex size-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${index <= current ? 'bg-primary text-white' : 'bg-[#eef3f8] text-muted'}`}>{index < current ? '✓' : index + 1}</span><span className={`flex-1 text-sm ${index === current ? 'font-bold text-primary' : 'font-medium text-muted'}`}>{label}</span>{index < labels.length - 1 && <FlowIcon name="imgChevronRight" size={16} />}</li>)}</ol>; }
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) { return <label className="flow-field"><span>{label}{props.required ? ' *' : ''}</span><input {...props} /><small>{hint}</small></label>; }
export function SelectField({ label, value, onChange, options, required = false, disabled = false }: { label: string; value: string; onChange(value: string): void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean }) { return <label className="flow-field"><span>{label}{required ? ' *' : ''}</span><select value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled}><option value="">Selecione</option>{options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }
export function Info({ children }: { children: ReactNode }) { return <div className="flex items-start gap-2.5 rounded-[8px] bg-[#e8f2fc] p-[14px] text-[13px] leading-[1.45] text-[#073e75]"><FlowIcon name="imgInfo" /> <div>{children}</div></div>; }
export function Message({ error, notice }: { error?: string | null; notice?: string }) { return <>{error && <p role="alert" className="rounded-lg bg-[#fdecec] p-[14px] text-[13px] text-[#c33d3d]">{error}</p>}{notice && <p role="status" className="rounded-lg bg-[#e8f6f0] p-[14px] text-[13px] text-[#167a52]">{notice}</p>}</>; }
export function Actions({ back, onBack, submit = 'Próximo', busy = false, hint = '* Campos obrigatórios' }: { back?: string; onBack?: () => void; submit?: string; busy?: boolean; hint?: string }) { return <footer className="flex items-center gap-3 border-t border-[#e8edf3] pt-5"><p className="flex-1 text-xs text-muted">{hint}</p>{back ? <Link className="flow-button" to={back}>Cancelar</Link> : <button type="button" className="flow-button" onClick={onBack} disabled={busy}>Voltar</button>}<button className="flow-button flow-primary" type="submit" disabled={busy}><FlowIcon name={submit.startsWith('Salvar') ? 'imgCheck' : 'imgArrowRight'} size={17} />{busy ? 'Salvando…' : submit}</button></footer>; }
export function SettingsTabs() { const { user } = useAuth(); return <nav aria-label="Abas de configurações" className="flex border-b border-[#dce4ed]">{[['Perfil', '/configuracoes/perfil'], ...(user?.papel === 'ADMIN' ? [['Usuários', '/configuracoes/usuarios'], ['Histórico de alterações', '/configuracoes/historico']] : [])].map(([label, path]) => <NavLink key={path} to={path} className={({ isActive }) => `settings-tab ${isActive ? 'border-b-2 border-primary font-bold text-primary' : 'text-muted'}`}>{label}</NavLink>)}</nav>; }
export function useStoredRecord<T extends { id: string }>(key: keyof DataServices, id: string | undefined) {
  const { services } = useData(); const [record, setRecord] = useState<T>(); const [loading, setLoading] = useState(Boolean(id)); const [error, setError] = useState('');
  useEffect(() => {
    let active = true; let version = 0; let unsubscribe: (() => void) | undefined;
    setRecord(undefined); setError('');
    if (!id) { setLoading(false); return; }
    async function reload(service: RecordService<T>) {
      const request = ++version; setLoading(true); setError('');
      try { const result = await service.getById(id!); if (active && request === version) { setRecord(result); if (!result) setError('Registro não encontrado.'); } }
      catch (cause) { if (active && request === version) { setRecord(undefined); setError(cause instanceof Error ? cause.message : 'Falha ao consultar.'); } }
      finally { if (active && request === version) setLoading(false); }
    }
    services.then(all => {
      if (!active) return;
      const source = all[key] as RecordService<T> | undefined;
      if (!source) throw new Error('Fonte indisponível.');
      unsubscribe = source.subscribe?.(() => { void reload(source); });
      void reload(source);
    }).catch(() => { if (active) { setError('Não foi possível iniciar a fonte de dados.'); setLoading(false); } });
    return () => { active = false; ++version; unsubscribe?.(); };
  }, [services, key, id]);
  return { record, loading, error };
}
export function Value({ label, value }: { label: string; value?: ReactNode }) { return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm leading-[1.45]">{value || 'Não informado'}</dd></div>; }
export function Pagination({ page, total, onChange, size = 8 }: { page: number; total: number; onChange(page: number): void; size?: number }) { const pages = Math.max(1, Math.ceil(total / size)); return <div className="flex items-center justify-between text-xs text-muted"><span>Exibindo {Math.min((page + 1) * size, total)} de {total} registros</span><div className="flex items-center gap-3"><span>Página {page + 1} de {pages}</span><button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => onChange(page - 1)}>‹</button><button type="button" aria-label="Próxima página" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>›</button></div></div>; }
