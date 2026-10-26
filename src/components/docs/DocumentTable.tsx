import { HomeIcon, type HomeIconName } from '../home/HomeIcon';
import type { DocumentRecord as Document, DocumentStatus } from '../../data/models';
import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
const statusStyles: Record<DocumentStatus, { color: string; background: string; indicator: HomeIconName; fileIcon: HomeIconName }> = {
  Vencido: { color: '#c33d3d', background: '#fdecec', indicator: 'imgIndicador', fileIcon: 'imgSimbolo16' },
  Atenção: { color: '#d97706', background: '#fff3dc', indicator: 'imgIndicador1', fileIcon: 'imgSimbolo18' },
  Válido: { color: '#167a52', background: '#e8f6f0', indicator: 'imgIndicador2', fileIcon: 'imgSimbolo19' },
};
export function DocumentTable() {
  const { documents } = useData();
  return <section aria-labelledby="documents-title" className="overflow-hidden rounded-[14px] border border-[#dce4ed] bg-white">
    <div className="flex items-center justify-between px-6 py-4"><h2 id="documents-title" className="text-lg font-bold">Documentos recentes</h2><button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-primary">Validade<HomeIcon name="imgSimbolo15" source="docs" /></button></div>
    <div role="table" aria-label="Documentos recentes">
      <div role="rowgroup"><div role="row" className="document-columns h-11 items-center bg-[#f5f7fa] px-6 text-xs font-semibold text-muted">{['Documento', 'Colaborador / obra', 'Validade', 'Responsável', 'Status', ''].map((label, index) => <div key={index} role="columnheader" aria-label={index === 5 ? 'Ações' : undefined}>{label}</div>)}</div></div>
      <div role="rowgroup">{documents.status === 'ready' && documents.records.map(document => <DocumentRow key={document.id} document={document} />)}</div>
    </div>
    <CollectionState collection={documents} empty="Nenhum documento cadastrado" />
    <footer className="flex h-[50px] items-center justify-between px-6 text-xs text-muted"><p>{documents.status === 'ready' ? `Exibindo ${documents.records.length} de ${documents.records.length} arquivos` : 'Consulta de documentos'}</p><button type="button" aria-label="Próxima página" className="flex items-center gap-1.5">Página 1<HomeIcon name="imgSimbolo20" source="docs" /></button></footer>
  </section>;
}
export function DocumentRow({ document }: { document: Document }) {
  const style = statusStyles[document.status];
  return <div role="row" className="document-columns min-h-[76px] items-center border-b border-[#e8edf3] px-6 py-4">
    <div role="cell" className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[6px]" style={{ backgroundColor: document.status === 'Válido' ? '#e8f2fc' : style.background, color: document.status === 'Válido' ? '#0b5cad' : style.color }}><HomeIcon name={style.fileIcon} source="docs" /><span className="text-[9px] font-bold">{document.type}</span></span><span className="min-w-0 flex-1 text-sm font-semibold">{document.title}</span></div>
    <div role="cell" className="text-[13px] text-muted">{document.collaborator}</div>
    <div role="cell" className="text-xs" style={{ color: style.color }}>{document.validity}</div>
    <div role="cell" className="text-[13px] text-muted">{document.owner}</div>
    <div role="cell"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold" style={{ backgroundColor: style.background, color: style.color }}><HomeIcon name={style.indicator} source="docs" />{document.status}</span></div>
    <div role="cell"><button type="button" aria-label={`Opções de ${document.title}`}><HomeIcon name="imgSimbolo17" source="docs" /></button></div>
  </div>;
}
