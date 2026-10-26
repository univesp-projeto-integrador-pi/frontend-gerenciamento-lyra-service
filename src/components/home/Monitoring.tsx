import { HomeIcon } from './HomeIcon';
import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
export function Monitoring() {
  const { works, documents } = useData();
  const work = works.status === 'ready' ? works.records[0] : undefined;
  const alert = documents.status === 'ready' ? documents.records.find(document => document.status !== 'Válido') : undefined;
  return <aside className="flex w-[352px] shrink-0 flex-col gap-5" aria-label="Acompanhamento">
    <section className="flex min-h-[232px] flex-col gap-5 rounded-[14px] bg-[#073e75] p-6 text-[#bed6ee]">
      <p className="flex items-center gap-2 text-xs"><HomeIcon name="imgSimbolo18" />Obra selecionada</p>
      {work ? <>
        <div className="flex flex-col gap-1.5"><h2 className="text-[22px] font-bold text-white">{work.name}</h2><p className="text-xs">{work.location ?? 'Localização não informada'}</p></div>
        <div className="flex flex-col gap-2"><p className="flex justify-between text-xs"><span>Progresso físico</span><span className="font-bold text-white">{work.progress === undefined ? 'Não informado' : work.progress + '%'}</span></p><div role="progressbar" aria-label="Progresso físico" aria-valuenow={work.progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-white/14"><div style={{ width: (work.progress ?? 0) + '%' }} className="h-full rounded-full bg-white" /></div></div>
        <p className="text-xs">Resp. {work.manager ?? 'Não informado'}</p>
      </> : <div className="[&_*]:text-[#bed6ee]"><CollectionState collection={works} empty="Nenhuma obra cadastrada" /></div>}
    </section>
    <section className="flex min-h-[148px] flex-col gap-[14px] rounded-[14px] bg-[#fff3dc] p-6">
      <div className="flex items-center justify-between"><HomeIcon name="imgSimbolo19" /><span className="flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold text-[#d97706]"><HomeIcon name="imgIndicador" />Atenção</span></div>
      {alert ? <><h2 className="text-lg font-bold">{alert.title} · {alert.validity}</h2><p className="text-[13px] text-muted">Responsável: {alert.owner}</p></> : documents.status === 'ready' ? <p className="text-[13px] text-muted">Nenhum documento exige atenção</p> : <CollectionState collection={documents} empty="Nenhum documento cadastrado" />}
    </section>
  </aside>;
}
