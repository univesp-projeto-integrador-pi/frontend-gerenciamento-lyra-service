import { useData } from '../../data/DataContext';
import { HomeIcon } from './HomeIcon';
export function HomeHeader({ title = 'Visão geral', source = 'home' }: { title?: string; source?: 'home' | 'works' | 'employees' | 'docs' | 'epi' }) {
  const { works } = useData();
  const selected = works.status === 'ready' ? works.records[0] : undefined;
  return <header className="flex h-20 shrink-0 items-center gap-6 border-b border-[#dce4ed] bg-white px-8">
    <div className="flex flex-1 items-center gap-3"><span className="text-[13px] text-muted">ObraSegura</span><span className="text-sm text-[#8a98aa]">/</span><span className="text-[13px] font-semibold">{title}</span></div>
    <button type="button" className="flex h-11 items-center gap-3 rounded-[10px] border border-[#dce4ed] bg-[#f5f7fa] px-[14px] text-[13px] font-semibold"><HomeIcon name="imgSimbolo6" source={source} />{selected?.name ?? 'Selecionar obra'}<HomeIcon name="imgSimbolo7" source={source} /></button>
    <button type="button" aria-label="Notificações" className="flex size-10 items-center justify-center rounded-[10px] border border-[#dce4ed]"><HomeIcon name="imgSimbolo8" source={source} /></button>
  </header>;
}
export function PageHeading({ title = 'Visão geral', subtitle = 'Acompanhe a gestão da obra', action = 'Adicionar novo registro', source = 'home' }: { title?: string; subtitle?: string; action?: string; source?: 'home' | 'works' | 'employees' | 'docs' | 'epi' }) {
  return <div className="flex items-center gap-6">
    <div className="flex flex-1 flex-col gap-1"><h1 className="text-[28px] font-bold">{title}</h1><p className="text-sm text-muted">{subtitle}</p></div>
    <button type="button" className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-[18px] text-sm font-semibold text-white"><HomeIcon name="imgSimbolo9" source={source} />{action}</button>
    <button type="button" aria-label="Mais opções" className="flex size-10 items-center justify-center rounded-[10px] border border-[#dce4ed] bg-white"><HomeIcon name="imgSimbolo10" source={source} /></button>
  </div>;
}
