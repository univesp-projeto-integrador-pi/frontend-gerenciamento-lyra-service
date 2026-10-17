import { Sidebar } from '../home/Sidebar';
import { HomeHeader, PageHeading } from '../home/HomeHeader';
import { HomeIcon, type HomeIconName } from '../home/HomeIcon';
import { EquipmentTable } from './EquipmentTable';
import { useData } from '../../data/DataContext';
import { countLabel } from '../../data/summary';
export function Equipment() {
  const { equipment } = useData();
  const total = countLabel(equipment);
  const replacement = equipment.status === 'ready' && equipment.records.every(item => item.replace !== undefined) ? equipment.records.filter(item => item.replace === true).length : '—';
  const stock = equipment.status === 'ready' && equipment.records.every(item => item.stockLow !== undefined) ? equipment.records.filter(item => item.stockLow === true).length : '—';
  const metrics: { value: string | number; label: string; icon: HomeIconName; background: string; dark?: boolean }[] = [
    { value: total, label: 'Itens controlados', icon: 'imgSimbolo', background: '#073e75', dark: true },
    { value: replacement, label: 'Trocar agora', icon: 'imgSimbolo11', background: '#fdecec' },
    { value: stock, label: 'Estoque baixo', icon: 'imgSimbolo12', background: '#fff3dc' },
  ];
  return <div className="epi-screen flex min-h-[900px] min-w-[1200px] bg-[#f5f7fa] text-ink">
    <Sidebar source="epi" />
    <div className="flex min-w-0 flex-1 flex-col"><HomeHeader title="EPIs" source="epi" />
      <main className="flex flex-col gap-6 p-8">
        <PageHeading title="EPIs" subtitle={`${total} itens controlados`} action="Adicionar EPI" source="epi" />
        <section aria-label="Resumo de EPIs" className="flex gap-5">{metrics.map(metric => <article key={metric.label} className={`flex h-[117px] min-w-0 flex-1 items-center gap-[18px] rounded-[14px] border p-6 ${metric.dark ? 'border-[#073e75] bg-[#073e75] text-white' : 'border-[#dce4ed] bg-white'}`}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: metric.background }}><HomeIcon name={metric.icon} source="epi" /></span>
          <div className="flex flex-col gap-0.5"><p className="text-[32px] font-bold">{metric.value}</p><p className={`text-[13px] ${metric.dark ? 'text-[#bed6ee]' : 'text-muted'}`}>{metric.label}</p></div>
        </article>)}</section>
        <div className="flex items-center gap-4">
          <div className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#dce4ed] bg-white px-[14px]"><HomeIcon name="imgSimbolo13" source="epi" /><input aria-label="Buscar EPI, CA ou funcionário" placeholder="Buscar EPI, CA ou funcionário" className="min-w-0 flex-1 text-sm text-muted outline-none placeholder:text-[#8a98aa]" /></div>
          <div className="flex items-start gap-2" aria-label="Filtros de EPIs">
            <button type="button" aria-pressed="true" className="flex h-[38px] items-center rounded-full border border-primary bg-primary px-[18px] text-[13px] font-semibold text-white">Entregues</button>
            <button type="button" className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[18px] text-[13px] font-medium text-[#c33d3d]">Troca {replacement}</button>
            <button type="button" className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[18px] text-[13px] font-medium text-muted">Estoque</button>
          </div>
          <button type="button" className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-[#dce4ed] bg-white px-[18px] text-sm font-semibold text-primary"><HomeIcon name="imgSimbolo14" source="epi" />Filtros</button>
        </div>
        <EquipmentTable />
      </main>
    </div>
  </div>;
}
