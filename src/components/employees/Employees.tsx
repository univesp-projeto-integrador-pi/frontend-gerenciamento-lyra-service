import { Sidebar } from '../home/Sidebar';
import { HomeHeader, PageHeading } from '../home/HomeHeader';
import { HomeIcon } from '../home/HomeIcon';
import { EmployeeTable } from './EmployeeTable';

import { useData } from '../../data/DataContext';
import { countLabel, presenceCount } from '../../data/summary';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
export function Employees() {
  const [params] = useSearchParams(); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [active, setActive] = useState(params.get('contrato') === 'ativos');
  const { employees } = useData();
  const total = countLabel(employees);
  const present = presenceCount(employees);
  const pending = presenceCount(employees, 'Pendente');
  return <div className="employees-screen flex min-h-[900px] min-w-[1200px] bg-[#f5f7fa] text-ink">
    <Sidebar source="employees" />
    <div className="flex min-w-0 flex-1 flex-col"><HomeHeader title="Funcionários" source="employees" />
      <main className="flex flex-col gap-6 p-8">
        <PageHeading title="Funcionários" subtitle={`${total} cadastrados`} action="Adicionar funcionário" source="employees" />
        <nav aria-label="Situação dos funcionários" className="flex gap-6 text-[13px] font-semibold text-primary"><Link to="/funcionarios">Todos</Link><Link to="/funcionarios/inativos">Inativos</Link></nav>
        <section aria-label="Resumo da equipe" className="flex items-center gap-4 rounded-[14px] bg-[#073e75] p-[22px]">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px]"><HomeIcon name="imgSimbolo11" source="employees" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-1"><h2 className="text-xl font-bold text-white">{present} em campo</h2><p className="text-[13px] text-[#bed6ee]">{typeof present === 'number' && employees.records.length ? `${Math.round(present / employees.records.length * 100)}% da equipe` : 'Sem informações de presença'}</p></div>
          <span className="flex items-center rounded-full bg-white/9 px-3 py-1.5"><span className="text-xs text-[#bed6ee]">{import.meta.env.VITE_DATA_MODE === 'api' ? 'Dados da API' : 'Dados locais'}</span></span>
        </section>
        <div className="flex items-center gap-4">
          <div className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#dce4ed] bg-white px-[14px]"><HomeIcon name="imgSimbolo12" source="employees" /><input value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar nome, função ou obra" placeholder="Buscar nome, função ou obra" className="min-w-0 flex-1 text-sm text-muted outline-none placeholder:text-[#8a98aa]" /></div>
          <div className="flex items-start gap-2" aria-label="Filtros da equipe">
            <button type="button" aria-pressed={status === ''} onClick={() => setStatus('')} className="flex h-[38px] items-center rounded-full border border-primary bg-primary px-[15px] text-[13px] font-semibold text-white">Todos {total}</button>
            <button type="button" disabled={import.meta.env.VITE_DATA_MODE === 'api'} aria-pressed={status === 'Em campo'} onClick={() => setStatus('Em campo')} className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[15px] text-[13px] font-medium text-muted">Em campo {present}</button>
            <button type="button" disabled={import.meta.env.VITE_DATA_MODE === 'api'} aria-pressed={status === 'Pendente'} onClick={() => setStatus('Pendente')} className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[15px] text-[13px] font-medium text-muted">Pendentes {pending}</button>
          </div>
          <button type="button" disabled={import.meta.env.VITE_DATA_MODE === 'api'} aria-pressed={active} onClick={() => setActive(v => !v)} title="Somente contratos ativos" className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-[#dce4ed] bg-white px-[18px] text-sm font-semibold text-primary"><HomeIcon name="imgSimbolo13" source="employees" />Filtros</button>
        </div>
        <EmployeeTable key={`${search}:${status}:${active}`} search={search} status={import.meta.env.VITE_DATA_MODE === 'api' ? '' : status} active={import.meta.env.VITE_DATA_MODE !== 'api' && active} />
      </main>
    </div>
  </div>;
}
