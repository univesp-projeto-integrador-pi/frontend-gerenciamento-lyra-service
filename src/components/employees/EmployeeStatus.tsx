import { HomeIcon } from '../home/HomeIcon';
export type EmployeeStatusName = 'Em campo' | 'Pendente' | 'Ausente' | 'AO VIVO';
export function EmployeeStatus({ status }: { status: EmployeeStatusName }) {
  const pending = status === 'Pendente';
  const absent = status === 'Ausente';
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold ${pending ? 'bg-[#fff3dc] text-[#d97706]' : absent ? 'bg-[#eef3f8] text-muted' : 'bg-[#e8f6f0] text-[#167a52]'}`}>
    <HomeIcon name={pending ? 'imgIndicador1' : absent ? 'imgIndicador2' : 'imgIndicador'} source="employees" />{status}
  </span>;
}
