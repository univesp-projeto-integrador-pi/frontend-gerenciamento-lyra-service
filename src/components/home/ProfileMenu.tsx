import { useEffect, useId, useRef, useState } from 'react';
import { HomeIcon } from './HomeIcon';

// Dados de apresentação fixos até a integração do perfil com um serviço.
const profile = { name: 'Admin', email: 'admin@teste.com', permission: 'Administrador' };

export function ProfileMenu({ source }: { source: 'home' | 'works' | 'employees' | 'docs' | 'epi' }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return <div ref={container} className="relative w-full">
    {open && <section id={panelId} aria-label="Informações do perfil" className="absolute bottom-full left-0 z-20 mb-3 w-[260px] rounded-[14px] border border-[#dce4ed] bg-white p-5 shadow-[0px_8px_28px_rgba(23,59,100,0.12)]">
      <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2fc] text-xs font-bold text-primary">AD</span><div><h2 className="text-sm font-semibold text-ink">{profile.name}</h2><p className="text-[11px] text-muted">Construtora Viva</p></div></div>
      <div className="my-4 h-px bg-[#e8edf3]" />
      <dl className="flex flex-col gap-4"><div><dt className="mb-1 text-[11px] text-muted">E-mail</dt><dd className="break-all text-[13px] text-ink">{profile.email}</dd></div><div><dt className="mb-1 text-[11px] text-muted">Nível de permissão</dt><dd className="inline-flex rounded-full bg-[#e8f2fc] px-2.5 py-1 text-xs font-semibold text-primary">{profile.permission}</dd></div></dl>
    </section>}
    <button ref={trigger} type="button" aria-label="Perfil de Admin" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(value => !value)} className={`flex w-full items-center gap-2.5 rounded-[10px] text-left transition-colors hover:bg-[#f5f7fa] ${open ? 'bg-[#f5f7fa]' : ''}`}>
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#e8f2fc] text-xs font-bold text-primary">AD</span>
      <span className="flex flex-1 flex-col gap-px"><span className="text-[13px] font-semibold text-ink">{profile.name}</span><span className="text-[11px] text-muted">Construtora Viva</span></span>
      <HomeIcon name="imgSimbolo5" source={source} />
    </button>
  </div>;
}
