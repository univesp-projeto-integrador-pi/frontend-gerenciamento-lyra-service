import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { normalizeSalary } from '../../data/money';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../auth/AuthContext';
import type { Employee } from '../../data/models';
import { attachments, validateFile } from '../../data/attachments';
import { documentExpiry, documentRules, documentStatus, formatDate } from '../../data/documentRules';
import { allocateEmployees } from '../../data/AllocationService';
import { Actions, Field, FlowPage, Info, Message, Panel, SelectField, Steps, useStoredRecord } from '../shared/FlowPage';
import { AddressFields, emptyAddress } from '../shared/AddressFields';
import { DocumentRows, WorkChoices, type DocumentDraft } from '../docs/DocumentFields';
import { initials } from '../shared/initials';
export function EmployeeForm() {
  const { user } = useAuth();
  const { id } = useParams(); const { record, loading, error: loadError } = useStoredRecord<Employee>('employees', id); const { services, works, employees, allocations, documents } = useData(); const navigate = useNavigate();
  const [step, setStep] = useState(0); const [draft, setDraft] = useState<Employee>({ id: '', name: '', role: '', work: 'Sem alocação', record: '', status: import.meta.env.VITE_DATA_MODE === 'api' ? undefined : 'Pendente', active: import.meta.env.VITE_DATA_MODE === 'api' ? undefined : true, address: emptyAddress() });
  const [selected, setSelected] = useState<string[]>([]); const [docs, setDocs] = useState<DocumentDraft[]>(documentRules.map(rule => ({ type: rule.name, issueDate: '', workIds: [] })));
  const [createdId, setCreatedId] = useState<string>(); const [savedDocs] = useState(new Set<string>()); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const api = import.meta.env.VITE_DATA_MODE === 'api';
  useEffect(() => { if (record) setDraft({ ...record, address: record.address ?? emptyAddress() }); }, [record]);
  const set = <K extends keyof Employee>(key: K, value: Employee[K]) => setDraft(current => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (step === 0) { if (!api && draft.cpf && !validCpf(draft.cpf)) { setError('Informe um CPF válido.'); return; } setStep(1); return; }
    if (step === 1) { if (api && draft.salary) { try { normalizeSalary(draft.salary); } catch (cause) { setError((cause as Error).message); return; } } if (api && record?.salary && !draft.salary) { setError('A API não permite apagar um salário existente; informe um valor válido.'); return; } if (draft.dismissalDate && draft.admissionDate && draft.dismissalDate < draft.admissionDate) { setError('A demissão não pode ser anterior à admissão.'); return; } setStep(2); return; }
    if (!api) for (const doc of docs) { if ((doc.file || doc.issueDate || doc.workIds.length) && (!doc.file || !doc.issueDate || !doc.workIds.length)) { setError(`Complete emissão, obras e arquivo de ${doc.type}, ou deixe a linha vazia.`); return; } }
    setBusy(true);
    try {
      const source = await services;
      if (!api && draft.cpf) { const all = await source.employees.getAll(); if (all.some(v => v.id !== (id ?? createdId) && v.cpf?.replace(/\D/g, '') === draft.cpf?.replace(/\D/g, ''))) throw new Error('Já existe um funcionário com este CPF nesta sessão.'); }
      const { id: _id, ...input } = draft;
      const key = id ?? createdId;
      const saved = key ? await source.employees.update(key, { ...input, name: draft.name.trim() }) : await source.employees.create({ ...input, name: draft.name.trim() });
      setCreatedId(saved.id);
      if (selected.length && draft.active !== false) {
        const existing = await source.allocations?.getAll() ?? [];
        for (const workId of selected) if (!existing.some(a => a.workId === workId && a.employeeId === saved.id && !a.endDate)) await allocateEmployees(source, { workId, employeeIds: [saved.id], startDate: new Date().toISOString().slice(0, 10) });
      }
      if (!api) for (const doc of docs) if (doc.file && doc.issueDate && !savedDocs.has(doc.type)) { const expiry = documentExpiry(doc.issueDate, doc.type); const savedDoc = await source.documents.create({ title: doc.type, type: doc.file.type === 'application/pdf' ? 'PDF' : 'IMG', collaborator: saved.name, owner: user?.name || 'Não informado', employeeId: saved.id, workIds: doc.workIds, issueDate: doc.issueDate, expiryDate: expiry, validity: formatDate(expiry), status: documentStatus(expiry) }); attachments.set(savedDoc.id, doc.file); savedDocs.add(doc.type); }
      employees.refresh(); allocations.refresh(); documents.refresh(); navigate(`/funcionarios/${saved.id}`, { state: { notice: 'Funcionário salvo com sucesso.' } });
    } catch (cause) { setError(`${createdId ? 'O cadastro principal já foi salvo. ' : ''}${cause instanceof Error ? cause.message : 'Não foi possível salvar o funcionário.'}`); } finally { setBusy(false); }
  }
  return <FlowPage area="Funcionários" title={id ? 'Editar funcionário' : 'Adicionar funcionário'} subtitle={step ? `${draft.name} · CPF ${draft.cpf || 'não informado'}` : 'Cadastre o colaborador e organize os documentos e as obras autorizadas.'} height={step === 0 ? 1112 : 1070}>
    <Steps labels={['Dados pessoais', 'Contrato', 'Documentos e obras']} current={step} /><Message error={loadError || error} />{loading ? <p role="status">Carregando funcionário…</p> : !loadError && <form onSubmit={submit}><Panel title={['Dados pessoais', 'Informações do contrato', 'Documentos e obras autorizadas'][step]} description={['As informações serão usadas na identificação e no histórico do colaborador.', 'Defina os dados de admissão e a jornada de trabalho.', 'Selecione os locais de trabalho e defina o vínculo específico de cada documento.'][step]}>
      {step === 0 && <>
        <div className="flex items-center gap-4 rounded-[10px] bg-[#f5f7fa] p-4"><span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#e8f2fc] text-xl font-bold text-primary">{draft.photo ? <img src={draft.photo} alt="Foto selecionada" className="size-full object-cover" /> : initials(draft.name)}</span><div className="flex-1"><h3 className="text-sm font-semibold">Foto do funcionário</h3><p className="mt-1 text-xs text-muted">JPG ou PNG de até 5 MB. Prefira uma foto de rosto.</p></div><label className="flow-button">Enviar foto<input className="sr-only" aria-label="Enviar foto" type="file" disabled={api} accept=".jpg,.jpeg,.png" onChange={e => { const file = e.target.files?.[0]; if (!file) return; try { validateFile(file, true); const reader = new FileReader(); reader.onload = () => set('photo', reader.result as string); reader.readAsDataURL(file); setError(''); } catch (cause) { setError((cause as Error).message); } }} /></label></div>
        <div className="grid grid-cols-2 gap-5"><Field label="Nome completo" required minLength={2} maxLength={120} value={draft.name} onChange={e => set('name', e.target.value)} /><Field disabled={api} label="CPF" required={!api} hint="CPF único no cadastro da sessão" maxLength={14} value={draft.cpf ?? ''} onChange={e => set('cpf', e.target.value)} /><Field disabled={api} label="Data de nascimento" type="date" required={!api} max={new Date().toISOString().slice(0, 10)} value={draft.birthDate ?? ''} onChange={e => set('birthDate', e.target.value)} /><Field disabled={api} label="Celular" type="tel" required={!api} value={draft.phone ?? ''} onChange={e => set('phone', e.target.value)} /></div>
        {api && <Field label="E-mail" type="email" required maxLength={254} hint="Campo obrigatório no contrato da API, ausente no Figma." value={draft.email ?? ''} onChange={e => set('email', e.target.value)} />}
        <h3 className="text-sm font-bold">Endereço completo</h3><AddressFields disabled={api} value={draft.address!} onChange={v => set('address', v)} required={!api} />
        <Info>{api ? 'A API armazena nome, e-mail, cargo e salário. Os demais dados pessoais e a foto ainda não estão disponíveis para edição.' : 'Dados pessoais e foto ficam disponíveis apenas nesta sessão. O funcionário pode ser vinculado a várias obras sem duplicar o cadastro.'}</Info>
      </>}
      {step === 1 && <>
        <div className="grid grid-cols-2 gap-5"><Field disabled={api} label="Data de admissão" type="date" required={!api} value={draft.admissionDate ?? ''} onChange={e => set('admissionDate', e.target.value)} /><Field disabled={api} label="Código de registro" required={!api} hint="Identificador interno do contrato." value={draft.record} onChange={e => set('record', e.target.value)} /><Field label="Cargo" required={!api} maxLength={80} value={draft.role} onChange={e => set('role', e.target.value)} /><Field disabled={api} label="Horário de trabalho" required={!api} value={draft.schedule ?? ''} onChange={e => set('schedule', e.target.value)} /><SelectField label="Situação" required value={api ? '' : draft.active === false ? 'inactive' : 'active'} onChange={v => set('active', v === 'active')} disabled={api} options={[{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }]} /><Field label="Data de demissão" type="date" disabled={draft.active !== false || api} required={draft.active === false && !api} min={draft.admissionDate} value={draft.dismissalDate ?? ''} onChange={e => set('dismissalDate', e.target.value)} hint="Campo obrigatório quando a situação for Inativo." /></div>
        {api && <Field label="Salário (opcional)" inputMode="decimal" maxLength={13} value={draft.salary ?? ''} onChange={e => set('salary', e.target.value)} hint="Valor decimal em reais, por exemplo 3500,00. Acesso restrito conforme a API." />}
        <div className="flow-muted-box flex min-h-[150px] flex-col gap-3"><span className="flow-badge self-start">{api ? 'Situação contratual não disponibilizada' : 'Contrato ' + (draft.active === false ? 'inativo' : 'ativo')}</span><h3 className="text-sm font-semibold">O que acontece ao inativar?</h3><p className="text-[13px] leading-[1.6] text-muted">Ao selecionar Inativo, informe a data de demissão. Novas alocações ficam indisponíveis, mas o cadastro, os documentos e os vínculos anteriores permanecem no histórico.</p></div><Info>{api ? 'A API aceita nome, e-mail, cargo e salário. Dados contratuais e inativação ainda não possuem endpoint; não serão enviados.' : 'O código de registro identifica o contrato. A inativação preserva os documentos e os vínculos anteriores.'}</Info>
      </>}
      {step === 2 && <><h3 className="text-sm font-bold">Obras autorizadas</h3>{works.status === 'ready' ? <WorkChoices works={works.records.filter(v => api || v.active !== false)} selected={selected} onChange={setSelected} /> : <Message error={works.error} notice={works.status === 'loading' ? 'Carregando obras…' : ''} />}{api ? <Info>O cadastro básico e as alocações utilizam a API. Documentos e arquivos aguardam endpoints próprios e não serão enviados.</Info> : <DocumentRows drafts={docs} onChange={setDocs} works={works.records.filter(v => v.active !== false)} onError={setError} />}<Info>Cada documento fica vinculado às obras selecionadas na sua linha. Autorizar uma obra não vincula automaticamente os documentos. Arquivos ficam disponíveis apenas nesta sessão.</Info></>}
      <Actions back={step === 0 ? '/funcionarios' : undefined} onBack={() => setStep(step - 1)} submit={step === 2 ? 'Salvar funcionário' : 'Próximo'} busy={busy} />
    </Panel></form>}
  </FlowPage>;
}
function validCpf(value: string) { const v = value.replace(/\D/g, ''); if (!/^\d{11}$/.test(v) || /^(\d)\1+$/.test(v)) return false; for (let n = 9; n <= 10; n++) { const sum = [...v.slice(0, n)].reduce((s, digit, i) => s + Number(digit) * (n + 1 - i), 0); if ((sum * 10 % 11) % 10 !== Number(v[n])) return false; } return true; }
