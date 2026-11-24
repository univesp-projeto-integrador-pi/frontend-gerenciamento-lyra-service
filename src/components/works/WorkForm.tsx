import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../data/DataContext';
import type { Work } from '../../data/models';
import { Actions, Field, FlowPage, Info, Message, Panel, SelectField, Steps, useStoredRecord } from '../shared/FlowPage';
import { AddressFields, addressLabel, emptyAddress } from '../shared/AddressFields';
import { FlowIcon } from '../shared/FlowIcon';
export const workStates = [{ value: 'PLANEJADA', label: 'Planejada' }, { value: 'EM_ANDAMENTO', label: 'Em andamento' }, { value: 'CONCLUIDA', label: 'Concluída' }, { value: 'INTERROMPIDA', label: 'Interrompida' }, { value: 'CANCELADA', label: 'Cancelada' }];
export function WorkForm() {
  const { id } = useParams(); const { record, loading, error: loadError } = useStoredRecord<Work>('works', id); const { user } = useAuth(); const { services, works } = useData(); const navigate = useNavigate();
  const [step, setStep] = useState(0); const [draft, setDraft] = useState<Work>({ id: '', name: '', nickname: '', code: '', company: '', startDate: '', endDate: '', state: 'EM_ANDAMENTO', addresses: [emptyAddress()], engineer: '', engineerPhone: '', admin: '', adminPhone: '', reason: '', closedDate: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const api = import.meta.env.VITE_DATA_MODE === 'api';
  useEffect(() => { if (record) setDraft({ ...record, addresses: record.addresses?.length ? record.addresses : [emptyAddress()] }); }, [record]);
  const set = <K extends keyof Work>(key: K, value: Work[K]) => setDraft(current => ({ ...current, [key]: value }));
  const inactive = draft.state === 'CONCLUIDA' || draft.state === 'CANCELADA' || draft.state === 'INTERROMPIDA';
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) { setError('A previsão de término não pode ser anterior ao início.'); return; }
    if (api && record && (record.startDate && !draft.startDate || record.endDate && !draft.endDate)) { setError('A API não permite apagar datas existentes; informe uma nova data válida.'); return; }
    if (step === 0) { setStep(1); return; }
    if (inactive && !api && (!draft.closedDate || !draft.reason?.trim())) { setError('Informe a data e a justificativa do encerramento ou interrupção.'); return; }
    if (draft.closedDate && draft.startDate && draft.closedDate < draft.startDate) { setError('O encerramento não pode ser anterior ao início.'); return; }
    setBusy(true);
    try {
      const source = await services;
      if (!api && draft.code?.trim()) { const all = await source.works.getAll(); if (all.some(v => v.id !== id && v.code?.toLowerCase() === draft.code?.trim().toLowerCase())) throw new Error('Já existe uma obra com este CBO.'); }
      const { id: _id, ...input } = { ...draft, ...(!api && inactive && { closedBy: draft.closedBy || user?.name }) };
      const location = api ? draft.location : draft.addresses?.map(addressLabel).filter(Boolean).join(' / ') || draft.location;
      if (api && location && location.length > 200) throw new Error('O endereço da API aceita no máximo 200 caracteres.');
      const saved = id ? await source.works.update(id, { ...input, name: draft.name.trim(), location, active: !inactive, manager: draft.engineer }) : await source.works.create({ ...input, name: draft.name.trim(), location, active: !inactive, manager: draft.engineer });
      works.refresh(); navigate(`/obras/${saved.id}`, { state: { notice: 'Obra salva com sucesso.' } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a obra.'); } finally { setBusy(false); }
  }
  return <FlowPage area="Obras" title={id ? 'Editar obra' : 'Adicionar obra'} subtitle={step ? `${draft.name} · CBO ${draft.code || 'não informado'} · ${workStates.find(v => v.value === draft.state)?.label}` : 'Organize os dados da obra, seus endereços e os responsáveis.'} height={step ? 1104 : 1000}>
    <Steps labels={['Dados gerais', 'Endereço e responsáveis']} current={step} /><Message error={loadError || error} />
    {loading ? <p role="status">Carregando obra…</p> : !loadError && <form onSubmit={submit}><Panel title={step ? 'Endereço e responsáveis' : 'Dados gerais'} description={step ? 'Mantenha os contatos de campo e da administração atualizados.' : 'Informe a identificação e o planejamento inicial da obra.'}>
      {step === 0 ? <>
        <div className="grid grid-cols-2 gap-5"><Field label="Nome da obra" required minLength={2} maxLength={120} value={draft.name} onChange={e => set('name', e.target.value)} /><Field disabled={api} label="Apelido" required={!api} maxLength={120} value={draft.nickname ?? ''} onChange={e => set('nickname', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-5"><Field disabled={api} label="CBO — Código de identificação da obra" required={!api} hint="Código interno único de identificação da obra." maxLength={50} value={draft.code ?? ''} onChange={e => set('code', e.target.value)} /><Field disabled={api} label="Empresa responsável" required={!api} value={draft.company ?? ''} onChange={e => set('company', e.target.value)} maxLength={120} /></div>
        <div className="grid grid-cols-2 gap-5"><Field label="Início da obra" type="date" required={!api} value={draft.startDate ?? ''} onChange={e => set('startDate', e.target.value)} /><Field label="Previsão de término" type="date" required={!api} min={draft.startDate} value={draft.endDate ?? ''} onChange={e => set('endDate', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-5"><SelectField label="Status" required value={draft.state ?? ''} onChange={v => set('state', v as Work['state'])} options={workStates.filter(v => api ? v.value !== 'INTERROMPIDA' : v.value !== 'CANCELADA')} /><Field label="Responsável pelo cadastro" readOnly value={user?.name ?? ''} /></div>
        <Info>{api ? 'A API aceita nome, endereço, status e datas. Os demais campos estão indisponíveis para edição.' : 'Obras Concluídas ou Interrompidas são inativas. Para esses estados, informe a data e a justificativa no próximo passo.'}</Info><p className="text-xs text-muted">O cadastro da obra não aloca funcionários automaticamente. A equipe poderá ser adicionada após salvar.</p>
      </> : <>
        {api && <Field label="Endereço da obra" maxLength={200} value={draft.location ?? ''} onChange={e => set('location', e.target.value)} hint="Endereço salvo pela API, até 200 caracteres." />}
        {(draft.addresses ?? []).map((address, index) => <div className="flex flex-col gap-5" key={index}><div className="flex items-center justify-between"><h3 className="text-sm font-bold">{index === 0 ? 'Endereço principal' : `Endereço de apoio ${index}`}</h3>{index === 0 && <button disabled={api} type="button" className="flow-button" onClick={() => set('addresses', [...draft.addresses!, emptyAddress()])}><FlowIcon name="imgPlus" />Adicionar endereço</button>}{index > 0 && <button className="flow-link text-xs" type="button" onClick={() => set('addresses', draft.addresses!.filter((_, i) => i !== index))}>Remover endereço</button>}</div><AddressFields disabled={api} required={!api} value={address} onChange={v => set('addresses', draft.addresses!.map((a, i) => i === index ? v : a))} /></div>)}
        <div className="grid grid-cols-2 gap-5"><Field disabled={api} label="Engenheiro responsável" required={!api} value={draft.engineer ?? ''} onChange={e => set('engineer', e.target.value)} /><Field disabled={api} label="Contato do engenheiro" type="tel" required={!api} value={draft.engineerPhone ?? ''} onChange={e => set('engineerPhone', e.target.value)} /><Field disabled={api} label="Administrativo responsável" required={!api} value={draft.admin ?? ''} onChange={e => set('admin', e.target.value)} /><Field disabled={api} label="Contato do administrativo" type="tel" required={!api} value={draft.adminPhone ?? ''} onChange={e => set('adminPhone', e.target.value)} /></div>
        <div className="flow-muted-box flex flex-col gap-4"><h3 className="text-sm font-bold">Encerramento ou interrupção</h3><p className="text-[13px] text-muted">Para Concluída ou Interrompida, a data e a justificativa são obrigatórias na simulação. Com status Em andamento, os campos abaixo não se aplicam.</p><div className="grid grid-cols-2 gap-5"><Field label="Data de encerramento / interrupção" type="date" disabled={!inactive || api} required={inactive && !api} value={draft.closedDate ?? ''} onChange={e => set('closedDate', e.target.value)} /><Field label="Justificativa" disabled={!inactive || api} required={inactive && !api} value={draft.reason ?? ''} onChange={e => set('reason', e.target.value)} /></div></div>
        {api && <Info>A API salva nome, endereço principal, status e datas. Apelido, CBO, empresa, contatos e justificativa ainda não possuem persistência no backend.</Info>}
      </>}
      <Actions back={step === 0 ? '/obras' : undefined} onBack={() => setStep(0)} submit={step ? 'Salvar obra' : 'Próximo'} busy={busy} />
    </Panel></form>}
  </FlowPage>;
}
