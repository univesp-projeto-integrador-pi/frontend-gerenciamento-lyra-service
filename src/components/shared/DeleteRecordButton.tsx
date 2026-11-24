import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { usePermissions } from '../../auth/RoleRoute';
import { ApiError } from '../../api/ApiClient';

export function DeleteRecordButton({ resource, id, name, label, returnTo, onDeleted }: { resource: 'works' | 'employees' | 'allocations'; id: string; name: string; label: string; returnTo?: string; onDeleted?: () => void }) {
  const { services } = useData();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const allowed = resource === 'employees' ? permissions.manageEmployees : permissions.manageWorks;
  const isWork = resource === 'works';

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [open]);
  function close() {
    if (pending.current) return;
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }
  async function remove() {
    if (pending.current || !allowed) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const service = (await services)[resource];
      if (!service) throw new Error('Serviço indisponível.');
      await service.delete(id);
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 404
        ? 'Este registro já não está disponível. A exclusão não foi confirmada. Atualize a consulta antes de tentar novamente.'
        : cause instanceof Error ? cause.message : 'Não foi possível excluir.');
      pending.current = false;
      setBusy(false);
      return;
    }
    pending.current = false;
    setBusy(false);
    close();
    const success = isWork ? `Obra “${name}” excluída permanentemente. Os funcionários foram preservados.` : 'Registro excluído permanentemente.';
    setNotice(success);
    if (returnTo) navigate(returnTo, { replace: true, state: { notice: success } });
    onDeleted?.();
  }
  if (!allowed) return null;
  return <>
    <button ref={trigger} type="button" className="text-[13px] font-semibold text-[#c33d3d] disabled:opacity-50" disabled={busy} onClick={() => { setOpen(true); setError(''); setNotice(''); }}>{label}</button>
    {notice && !returnTo && <p role="status" className="text-[13px] text-[#167a52]">{notice}</p>}
    {open && <dialog ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={title} aria-describedby={description} aria-busy={busy} className="m-auto max-h-[calc(100dvh-32px)] w-[460px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[14px] border border-[#dce4ed] bg-white p-6 text-ink shadow-xl backdrop:bg-black/35" onCancel={event => { event.preventDefault(); close(); }}>
      <h2 id={title} className="text-lg font-bold">{isWork ? 'Excluir obra?' : 'Confirmar exclusão permanente'}</h2>
      <div id={description}>
        <p className="mt-4 break-words text-sm">{isWork ? `Você está prestes a excluir permanentemente a obra “${name}”.` : name}</p>
        <p className="mt-3 text-[13px] leading-[1.5] text-muted">{resource === 'allocations'
          ? 'Este vínculo será excluído permanentemente. O funcionário e a obra serão preservados.'
          : resource === 'employees'
            ? 'O funcionário e suas alocações serão excluídos permanentemente. A conta vinculada será desativada.'
            : 'As alocações de funcionários nesta obra também serão removidas. Os funcionários continuarão cadastrados no sistema.'} Esta ação não pode ser desfeita.</p>
      </div>
      {error && <p role="alert" className="mt-4 text-[13px] text-[#c33d3d]">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button autoFocus type="button" className="flow-button" disabled={busy} onClick={close}>Cancelar</button>
        <button type="button" className="flow-button bg-[#c33d3d]! text-white! disabled:opacity-50" disabled={busy} onClick={() => void remove()}>{busy ? 'Excluindo…' : isWork ? 'Excluir obra' : 'Excluir permanentemente'}</button>
      </div>
    </dialog>}
  </>;
}
