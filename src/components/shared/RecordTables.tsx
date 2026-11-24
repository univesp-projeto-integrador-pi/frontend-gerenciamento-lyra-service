import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { usePermissions } from '../../auth/RoleRoute';
import type { Allocation, DocumentRecord } from '../../data/models';
import { documentStatus, formatDate } from '../../data/documentRules';
import { allocationLabel } from '../../data/allocationDates';
import { attachments } from '../../data/attachments';
import { CollectionState } from './CollectionState';
import { Pagination, Message } from './FlowPage';
import { DeleteRecordButton } from './DeleteRecordButton';
export function AllocationTable({ rows, employeeId, history = false }: { rows: Allocation[]; employeeId?: string; history?: boolean }) {
  const { allocations, employees, works, services } = useData(); const { manageWorks } = usePermissions();
  const [page, setPage] = useState(0); const [editing, setEditing] = useState<string>(); const [target, setTarget] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const api = import.meta.env.VITE_DATA_MODE === 'api'; const editable = api && manageWorks && !history;
  const unavailableHistory = api && history;
  const source = unavailableHistory ? { ...allocations, status: 'error' as const, records: [], error: 'A API não fornece datas de retirada ou histórico de encerramento de alocações.' } : { ...allocations, records: rows };
  async function save(row: Allocation) {
    setBusy(true); setError('');
    try { const service = (await services).allocations; if (!service) throw new Error('Serviço indisponível.'); await service.update(row.id, { employeeId: row.employeeId, workId: target }); setEditing(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível editar o vínculo.'); }
    finally { setBusy(false); }
  }
  const headers = employeeId ? ['Obra', 'Função / cargo', api ? 'Criado em' : 'Inclusão', 'Retirada', 'Status'] : ['Nome', 'CPF', 'Cargo', api ? 'Criado em' : 'Data de inclusão', 'Data de retirada'];
  return <><Message error={error} /><table className="flow-table"><thead><tr>{[...headers, ...(editable ? ['Ações'] : [])].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{!unavailableHistory && rows.slice(page * 8, page * 8 + 8).map(row => {
    const employee = employees.records.find(v => v.id === row.employeeId); const work = works.records.find(v => v.id === row.workId);
    const employeeName = row.employeeName || employee?.name || 'Funcionário indisponível'; const workName = row.workName || work?.name || 'Obra indisponível';
    return <tr key={row.id}><td><Link to={employeeId ? '/obras/' + row.workId : '/funcionarios/' + row.employeeId}>{employeeId ? workName : employeeName}</Link></td>{!employeeId && <td>{employee?.cpf || 'Não informado'}</td>}<td>{row.employeeRole || employee?.role || 'Não informado'}</td><td>{formatDate(api ? row.createdAt : row.startDate)}</td><td>{api ? 'Não disponibilizada' : row.endDate ? formatDate(row.endDate) : '—'}</td>{employeeId && <td><span className="flow-badge">{allocationLabel(row)}</span></td>}{editable && <td><div className="flex flex-col items-start gap-2">{editing === row.id ? <><select aria-label={'Obra do vínculo de ' + employeeName} className="settings-input" value={target} disabled={busy} onChange={event => setTarget(event.target.value)}>{works.records.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select><button className="flow-link" disabled={busy || target === row.workId} onClick={() => void save(row)}>Salvar vínculo</button><button className="flow-link" disabled={busy} onClick={() => setEditing(undefined)}>Cancelar edição</button></> : <button className="flow-link" onClick={() => { setEditing(row.id); setTarget(row.workId); setError(''); }}>Editar vínculo</button>}<DeleteRecordButton resource="allocations" id={row.id} name={employeeName + ' → ' + workName} label="Excluir vínculo" /></div></td>}</tr>;
  })}</tbody></table><CollectionState collection={source} empty={history ? 'Nenhuma alocação anterior encontrada.' : 'Nenhum funcionário alocado.'} />{source.status === 'ready' && <Pagination page={page} total={rows.length} onChange={setPage} />}</>;
}
export function LinkedDocuments({ rows }: { rows: DocumentRecord[] }) {
  const { documents, works } = useData(); const [page, setPage] = useState(0); const [error, setError] = useState('');
  function open(id: string) { const file = attachments.get(id); if (!file) { setError('O arquivo não está disponível nesta sessão. O armazenamento de anexos depende do backend.'); return; } setError(''); const url = URL.createObjectURL(file); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  return <><Message error={error} /><table className="flow-table"><thead><tr>{['Documento / periodicidade', 'Emissão', 'Validade', 'Obra(s) vinculada(s)', 'Status'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.slice(page * 8, page * 8 + 8).map(row => <tr key={row.id}><td><button className="flow-link text-left" onClick={() => open(row.id)}>{row.title}</button></td><td>{formatDate(row.issueDate)}</td><td>{row.expiryDate ? formatDate(row.expiryDate) : row.validity}</td><td>{row.workIds?.map(id => works.records.find(v => v.id === id)?.name || 'Obra indisponível').join(', ') || 'Não informado'}</td><td><span className="flow-badge">{row.expiryDate ? documentStatus(row.expiryDate) : row.status}</span></td></tr>)}</tbody></table><CollectionState collection={{ ...documents, records: rows }} empty="Nenhum documento encontrado." />{documents.status === 'ready' && <Pagination page={page} total={rows.length} onChange={setPage} />}</>;
}
