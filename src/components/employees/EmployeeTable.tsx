import { HomeIcon } from '../home/HomeIcon';
import { EmployeeStatus } from './EmployeeStatus';
import type { Employee } from '../../data/models';
import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
export function EmployeeTable() {
  const { employees } = useData();
  return <section aria-labelledby="team-title" className="overflow-hidden rounded-[14px] border border-[#dce4ed] bg-white">
    <div className="flex items-center justify-between px-6 py-4"><h2 id="team-title" className="text-lg font-bold">Equipe</h2><button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-primary">Por obra<HomeIcon name="imgSimbolo14" source="employees" /></button></div>
    <div role="table" aria-label="Equipe">
      <div role="rowgroup"><div role="row" className="employee-columns h-11 items-center bg-[#f5f7fa] px-6 text-xs font-semibold text-muted">
        {['Funcionário', 'Função', 'Obra', 'Registro de hoje', 'Status', ''].map((label, index) => <div role="columnheader" key={index} aria-label={index === 5 ? 'Ações' : undefined}>{label}</div>)}
      </div></div>
      <div role="rowgroup">{employees.status === 'ready' && employees.records.map(employee => <EmployeeRow key={employee.id} employee={employee} />)}</div>
    </div>
    <CollectionState collection={employees} empty="Nenhum funcionário cadastrado" />
    <footer className="flex h-[50px] items-center justify-between px-6 text-xs text-muted"><p>{employees.status === 'ready' ? `Exibindo ${employees.records.length} de ${employees.records.length} funcionários` : 'Consulta de funcionários'}</p><button type="button" aria-label="Próxima página" className="flex items-center gap-1.5">Página 1<HomeIcon name="imgSimbolo16" source="employees" /></button></footer>
  </section>;
}
export function EmployeeRow({ employee }: { employee: Employee }) {
  return <div role="row" className="employee-columns min-h-[76px] items-center border-b border-[#e8edf3] px-6 py-4">
    <div role="cell" className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2fc] text-xs font-bold text-primary">{employee.name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span><span className="text-sm font-semibold">{employee.name}</span></div>
    <div role="cell" className="text-[13px] text-muted">{employee.role}</div>
    <div role="cell" className="text-[13px] text-muted">{employee.work}</div>
    <div role="cell" className={`text-xs ${employee.status === 'Pendente' ? 'text-[#d97706]' : 'text-muted'}`}>{employee.record}</div>
    <div role="cell"><EmployeeStatus status={employee.status} /></div>
    <div role="cell"><button type="button" aria-label={`Opções de ${employee.name}`}><HomeIcon name="imgSimbolo15" source="employees" /></button></div>
  </div>;
}
