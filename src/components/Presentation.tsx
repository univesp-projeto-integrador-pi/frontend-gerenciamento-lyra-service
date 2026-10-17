import { Icon } from './Icon';
export function Presentation() {
  return <section className="presentation relative flex shrink-0 flex-col justify-between overflow-hidden bg-[#073e75] p-14 text-white" aria-label="CleanPro">
    <img src="/assets/construction.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-linear-to-b from-[rgba(7,62,117,0.85)] to-[rgba(7,62,117,0.97)]" />
    <div className="relative flex items-center gap-2.5"><div className="flex size-[38px] items-center justify-center rounded-[10px] bg-white"><Icon name="brand" /></div><span className="text-xl font-bold leading-[1.45]">CleanPro</span></div>
    <div className="relative flex flex-col gap-6">
      <h1 className="text-5xl font-bold leading-[1.12]">Segurança que acompanha a obra.</h1>
      <p className="text-xl leading-[1.45] text-[#dcebfa]">Controle equipes, documentos e EPIs em um só lugar.</p>
      <div className="flex gap-6 pt-4 text-[13px] leading-[1.45] text-[#bed6ee]">
        <span className="flex items-center gap-2"><Icon name="users" />Equipes</span>
        <span className="flex items-center gap-2"><Icon name="documents" />Documentos</span>
        <span className="flex items-center gap-2"><Icon name="helmet" />EPIs</span>
      </div>
    </div>
    <p className="relative flex items-center gap-2.5 text-[13px] leading-[1.45] text-[#bed6ee]"><Icon name="shield" />Acesso protegido e dados criptografados</p>
  </section>;
}
