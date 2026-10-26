import { HomeIcon, PendingBadge, type HomeIconName } from './HomeIcon';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { countFlag, countLabel, workSummary } from '../../data/summary';
export function Metrics() {
  const { employees, documents, equipment } = useData();
  const replacements = countFlag(equipment, record => record.replace);
  const pending = documents.status === 'ready' && typeof replacements === 'number'
    ? documents.records.filter(record => record.status !== 'Válido').length + replacements : '—';
  const metrics: { value: number | string; label: string; icon: HomeIconName; background: string }[] = [
    { value: '—', label: 'Conformidade', icon: 'imgSimbolo11', background: '#e8f6f0' },
    { value: pending, label: 'Pendências', icon: 'imgSimbolo12', background: '#fff3dc' },
    { value: countLabel(employees, record => record.status === 'Em campo'), label: 'Em campo', icon: 'imgSimbolo13', background: '#e8f2fc' },
  ];
  return <section aria-label="Indicadores" className="flex gap-5">{metrics.map(metric => <article key={metric.label} className="flex min-w-0 flex-1 items-center gap-[18px] rounded-[14px] border border-[#dce4ed] bg-white p-6">
    <span style={{ backgroundColor: metric.background }} className="flex size-12 shrink-0 items-center justify-center rounded-[10px]"><HomeIcon name={metric.icon} /></span>
    <div className="flex flex-col gap-0.5"><p className="text-[32px] font-bold">{metric.value}</p><p className="text-[13px] text-muted">{metric.label}</p></div>
  </article>)}</section>;
}
export function Management() {
  const navigate = useNavigate();
  const { works, employees, documents, equipment } = useData();
  const summary = workSummary(works.records);
  const pendingDocs = countLabel(documents, record => record.status !== 'Válido');
  const pendingEquipment = countFlag(equipment, record => record.replace);
  const cards: { title: string; detail: string; icon: HomeIconName; background: string; count?: number | string; to: string }[] = [
    { title: 'Obras', detail: countLabel(works) + ' cadastradas · ' + (works.status === 'ready' ? summary.active : '—') + ' ativas', icon: 'imgSimbolo14', background: '#e8f2fc', to: '/obras' },
    { title: 'Funcionários', detail: countLabel(employees) + ' cadastrados · ' + countLabel(employees, record => record.status === 'Em campo') + ' em campo', icon: 'imgSimbolo13', background: '#e8f2fc', to: '/funcionarios' },
    { title: 'Documentos', detail: countLabel(documents) + ' arquivos · ' + pendingDocs + ' pendências', icon: 'imgSimbolo16', background: '#fff3dc', count: pendingDocs, to: '/docs' },
    { title: 'EPIs', detail: countLabel(equipment) + ' itens · ' + pendingEquipment + ' trocas necessárias', icon: 'imgSimbolo17', background: '#fdecec', count: pendingEquipment, to: '/epi' },
  ];
  return <section className="flex min-w-0 flex-1 flex-col gap-4" aria-labelledby="management-title">
    <div className="flex items-center justify-between"><h2 id="management-title" className="text-lg font-bold">Gestão da obra</h2><button type="button" className="text-[13px] font-semibold text-primary">Ver tudo</button></div>
    <div className="grid grid-cols-2 gap-4">{cards.map(card => <button key={card.title} type="button" onClick={() => navigate(card.to)} className="flex h-[180px] min-w-0 flex-col justify-between rounded-[14px] border border-[#dce4ed] bg-white p-6 text-left shadow-[0px_4px_16px_0px_rgba(23,59,100,0.04)]">
      <span className="flex w-full items-center justify-between"><span style={{ backgroundColor: card.background }} className="flex size-11 items-center justify-center rounded-[10px]"><HomeIcon name={card.icon} /></span><HomeIcon name="imgSimbolo15" /></span>
      <span className="flex w-full flex-col gap-1.5"><span className="flex items-center gap-2"><span className="text-lg font-bold">{card.title}</span>{typeof card.count === 'number' && card.count > 0 && <PendingBadge count={card.count} />}</span><span className="text-[13px] text-muted">{card.detail}</span></span>
    </button>)}</div>
  </section>;
}
