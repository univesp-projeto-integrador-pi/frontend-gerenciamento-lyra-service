import { Sidebar } from '../home/Sidebar';
import { HomeHeader, PageHeading } from '../home/HomeHeader';
import { HomeIcon, type HomeIconName } from '../home/HomeIcon';
import { WorkCard } from './WorkCard';
import { useData } from '../../data/DataContext';
import { countLabel, workSummary } from '../../data/summary';
import { CollectionState } from '../shared/CollectionState';

export function WorksIcon({ name }: { name: HomeIconName }) {
  return <HomeIcon name={name} source="works" />;
}
export function Works() {
  const { works } = useData();
  const summary = workSummary(works.records);
  const metrics = [
    { value: works.status === 'ready' ? summary.active : '—', label: 'Ativas', icon: 'imgSimbolo11' as const, background: '#073e75', dark: true },
    { value: works.status === 'ready' ? summary.progress : '—', label: 'Média física', icon: 'imgChartNoAxesCombined' as const, background: '#e8f2fc', dark: false },
    { value: works.status === 'ready' ? summary.inspections : '—', label: 'Vistoria hoje', icon: 'imgSimbolo12' as const, background: '#fff3dc', dark: false },
  ];
  return <div className="works-screen flex min-h-[900px] min-w-[1200px] bg-[#f5f7fa] text-ink">
    <Sidebar source="works" />
    <div className="flex min-w-0 flex-1 flex-col"><HomeHeader title="Obras" source="works" />
      <main className="flex flex-col gap-6 p-8">
        <PageHeading title="Obras" subtitle={`${countLabel(works)} obras cadastradas`} action="Adicionar obra" source="works" />
        <section aria-label="Resumo das obras" className="flex gap-5">{metrics.map(metric => <article key={metric.label} className={`flex h-[117px] min-w-0 flex-1 items-center gap-[18px] rounded-[14px] border p-6 ${metric.dark ? 'border-[#073e75] bg-[#073e75] text-white' : 'border-[#dce4ed] bg-white'}`}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: metric.background }}><WorksIcon name={metric.icon} /></span>
          <div className="flex flex-col gap-0.5"><p className="text-[32px] font-bold">{metric.value}</p><p className={`text-[13px] ${metric.dark ? 'text-[#bed6ee]' : 'text-muted'}`}>{metric.label}</p></div>
        </article>)}</section>
        <div className="flex items-center gap-4">
          <div className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#dce4ed] bg-white px-[14px]"><WorksIcon name="imgSimbolo13" /><input aria-label="Buscar obra ou endereço" placeholder="Buscar obra ou endereço" className="min-w-0 flex-1 text-sm text-muted outline-none placeholder:text-[#8a98aa]" /></div>
          <button type="button" className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-[#dce4ed] bg-white px-[18px] text-sm font-semibold text-primary"><WorksIcon name="imgSimbolo14" />Filtros</button>
        </div>
        <section aria-labelledby="works-title" className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><h2 id="works-title" className="text-lg font-bold">Suas obras</h2><button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-primary">Ordenar<WorksIcon name="imgSimbolo15" /></button></div>
          <CollectionState collection={works} empty="Nenhuma obra cadastrada" />{works.status === 'ready' && works.records.length > 0 && <div className="grid grid-cols-3 gap-5">{works.records.map(work => <WorkCard key={work.id} work={work} />)}</div>}
          <p className="text-xs text-muted">{works.status === 'ready' ? `Exibindo ${works.records.length} de ${works.records.length} obras cadastradas` : 'Consulta de obras'}</p>
        </section>
      </main>
    </div>
  </div>;
}
