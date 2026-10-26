import { Sidebar } from '../home/Sidebar';
import { HomeHeader, PageHeading } from '../home/HomeHeader';
import { HomeIcon } from '../home/HomeIcon';
import { DocumentTable } from './DocumentTable';

import { useData } from '../../data/DataContext';
import { countLabel } from '../../data/summary';
export function Documents() {
  const { documents } = useData();
  const total = countLabel(documents);
  const expired = countLabel(documents, record => record.status === 'Vencido');
  const attention = countLabel(documents, record => record.status === 'Atenção');
  const pending = countLabel(documents, record => record.status !== 'Válido');
  return <div className="docs-screen flex min-h-[900px] min-w-[1200px] bg-[#f5f7fa] text-ink">
    <Sidebar source="docs" />
    <div className="flex min-w-0 flex-1 flex-col"><HomeHeader title="Documentos" source="docs" />
      <main className="flex flex-col gap-6 p-8">
        <PageHeading title="Documentos" subtitle={`${total} arquivos`} action="Adicionar documento" source="docs" />
        <section aria-label="Resumo dos documentos" className="flex items-center gap-4 rounded-[14px] bg-[#fff3dc] p-[22px]">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px]"><HomeIcon name="imgSimbolo11" source="docs" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-1"><h2 className="text-xl font-bold">{pending} documentos exigem atenção</h2><p className="text-[13px] text-muted">{expired} vencidos · {attention} em atenção</p></div>
          <button type="button" aria-label="Ver documentos que exigem atenção"><HomeIcon name="imgSimbolo12" source="docs" /></button>
        </section>
        <div className="flex items-center gap-4">
          <div className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#dce4ed] bg-white px-[14px]"><HomeIcon name="imgSimbolo13" source="docs" /><input aria-label="Buscar documento ou colaborador" placeholder="Buscar documento ou colaborador" className="min-w-0 flex-1 text-sm text-muted outline-none placeholder:text-[#8a98aa]" /></div>
          <div className="flex items-start gap-2" aria-label="Filtros dos documentos">
            <button type="button" aria-pressed="true" className="flex h-[38px] items-center rounded-full border border-primary bg-primary px-[17px] text-[13px] font-semibold text-white">Todos {total}</button>
            <button type="button" className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[17px] text-[13px] font-medium text-[#c33d3d]">Vencidos {expired}</button>
            <button type="button" className="flex h-[38px] items-center rounded-full border border-[#dce4ed] bg-white px-[17px] text-[13px] font-medium text-[#d97706]">A vencer {attention}</button>
          </div>
          <button type="button" className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-[#dce4ed] bg-white px-[18px] text-sm font-semibold text-primary"><HomeIcon name="imgSimbolo14" source="docs" />Filtros</button>
        </div>
        <DocumentTable />
      </main>
    </div>
  </div>;
}
