import { HomeIcon, type HomeIconName } from '../home/HomeIcon';
import type { DocumentRecord as Document, DocumentStatus } from '../../data/models';
import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
import { useState } from 'react';
import { attachments } from '../../data/attachments';
import { Pagination, Message } from '../shared/FlowPage';
const statusStyles: Record<DocumentStatus, { color: string; background: string; indicator: HomeIconName; fileIcon: HomeIconName }> = {
  Vencido: { color: '#c33d3d', background: '#fdecec', indicator: 'imgIndicador', fileIcon: 'imgSimbolo16' },
  Atenção: { color: '#d97706', background: '#fff3dc', indicator: 'imgIndicador1', fileIcon: 'imgSimbolo18' },
  Válido: { color: '#167a52', background: '#e8f6f0', indicator: 'imgIndicador2', fileIcon: 'imgSimbolo19' },
};
export function DocumentTable({ search = '', status = '' }: { search?: string; status?: string }) {
  const { documents } = useData();
  const [page, setPage] = useState(0); const [ascending, setAscending] = useState(false);
  const rows = documents.records.filter(v => `${v.title} ${v.collaborator}`.toLowerCase().includes(search.toLowerCase()) && (!status || (status === 'pendentes' ? v.status !== 'Válido' : v.status === status))).sort((a, b) => ascending ? (a.expiryDate ?? a.validity).localeCompare(b.expiryDate ?? b.validity) : 0);
  return <section aria-labelledby="documents-title" className="overflow-hidden rounded-[14px] border border-[#dce4ed] bg-white">
    <div className="flex items-center justify-between px-6 py-4"><h2 id="documents-title" className="text-lg font-bold">Documentos recentes</h2><button type="button" aria-pressed={ascending} onClick={() => { setAscending(v => !v); setPage(0); }} className="flex items-center gap-2 text-[13px] font-semibold text-primary">Validade<HomeIcon name="imgSimbolo15" source="docs" /></button></div>
    <div role="table" aria-label="Documentos recentes">
      <div role="rowgroup"><div role="row" className="document-columns h-11 items-center bg-[#f5f7fa] px-6 text-xs font-semibold text-muted">{['Documento', 'Colaborador / obra', 'Validade', 'Responsável', 'Status', ''].map((label, index) => <div key={index} role="columnheader" aria-label={index === 5 ? 'Ações' : undefined}>{label}</div>)}</div></div>
      <div role="rowgroup">{documents.status === 'ready' && rows.slice(page * 8, page * 8 + 8).map(document => <DocumentRow key={document.id} document={document} />)}</div>
    </div>
    <CollectionState collection={{ ...documents, records: rows }} empty={documents.records.length ? 'Nenhum documento encontrado' : 'Nenhum documento cadastrado'} />
    <footer className="px-6 py-4">{documents.status === 'ready' ? <Pagination page={page} total={rows.length} onChange={setPage} /> : <p className="text-xs text-muted">Consulta de documentos</p>}</footer>
  </section>;
}
export function DocumentRow({ document }: { document: Document }) {
  const [error, setError] = useState('');
  function open() { const file = attachments.get(document.id); if (!file) { setError('Arquivo indisponível nesta sessão. O armazenamento de anexos depende do backend.'); return; } const url = URL.createObjectURL(file); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  const style = statusStyles[document.status];
  return <div role="row" className="document-columns min-h-[76px] items-center border-b border-[#e8edf3] px-6 py-4">
    <div role="cell" className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[6px]" style={{ backgroundColor: document.status === 'Válido' ? '#e8f2fc' : style.background, color: document.status === 'Válido' ? '#0b5cad' : style.color }}><HomeIcon name={style.fileIcon} source="docs" /><span className="text-[9px] font-bold">{document.type}</span></span><span className="min-w-0 flex-1 text-sm font-semibold">{document.title}</span></div>
    <div role="cell" className="text-[13px] text-muted">{document.collaborator}</div>
    <div role="cell" className="text-xs" style={{ color: style.color }}>{document.validity}</div>
    <div role="cell" className="text-[13px] text-muted">{document.owner}</div>
    <div role="cell"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold" style={{ backgroundColor: style.background, color: style.color }}><HomeIcon name={style.indicator} source="docs" />{document.status}</span></div>
    <div role="cell"><button type="button" aria-label={`Opções de ${document.title}`} onClick={open}><HomeIcon name="imgSimbolo17" source="docs" /></button><Message error={error} /></div>
  </div>;
}
