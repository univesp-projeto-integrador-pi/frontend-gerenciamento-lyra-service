import { HomeIcon, type HomeIconName } from '../home/HomeIcon';
import type { EquipmentItem } from '../../data/models';
import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
const equipmentIcons: Record<EquipmentItem['kind'], HomeIconName> = { helmet: 'imgSimbolo16', glasses: 'imgSimbolo18', harness: 'imgSimbolo19', hearing: 'imgSimbolo20' };
export function EquipmentTable() {
  const { equipment } = useData();
  return <section aria-labelledby="equipment-title" className="overflow-hidden rounded-[14px] border border-[#dce4ed] bg-white">
    <div className="flex items-center justify-between px-6 py-4"><h2 id="equipment-title" className="text-lg font-bold">Controle de entregas</h2><button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-primary">Mais recentes<HomeIcon name="imgSimbolo15" source="epi" /></button></div>
    <div role="table" aria-label="Controle de entregas">
      <div role="rowgroup"><div role="row" className="equipment-columns h-11 items-center bg-[#f5f7fa] px-6 text-xs font-semibold text-muted">{['Equipamento', 'CA', 'Funcionário', 'Entrega / condição', 'Responsável', 'Status', ''].map((label, index) => <div role="columnheader" key={index} aria-label={index === 6 ? 'Ações' : undefined}>{label}</div>)}</div></div>
      <div role="rowgroup">{equipment.status === 'ready' && equipment.records.map(item => <EquipmentRow key={item.id} item={item} />)}</div>
    </div>
    <CollectionState collection={equipment} empty="Nenhum EPI cadastrado" />
    <footer className="flex h-[50px] items-center justify-between px-6 text-xs text-muted"><p>{equipment.status === 'ready' ? `Exibindo ${equipment.records.length} de ${equipment.records.length} itens controlados` : 'Consulta de EPIs'}</p><button type="button" aria-label="Próxima página" className="flex items-center gap-1.5">Página 1<HomeIcon name="imgSimbolo21" source="epi" /></button></footer>
  </section>;
}
export function EquipmentRow({ item }: { item: EquipmentItem }) {
  return <div role="row" className="equipment-columns min-h-[76px] items-center border-b border-[#e8edf3] px-6 py-4">
    <div role="cell" className="flex min-w-0 items-center gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${item.replace ? 'bg-[#fdecec]' : 'bg-[#e8f2fc]'}`}><HomeIcon name={equipmentIcons[item.kind]} source="epi" /></span><span className="min-w-0 flex-1 text-sm font-semibold">{item.name}</span></div>
    <div role="cell" className="text-[13px] text-muted">{item.ca}</div>
    <div role="cell" className="text-[13px] text-muted">{item.employee}</div>
    <div role="cell" className={`text-xs ${item.replace ? 'text-[#c33d3d]' : 'text-muted'}`}>{item.condition}</div>
    <div role="cell" className="text-[13px] text-muted">{item.owner}</div>
    <div role="cell"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold ${item.replace === undefined ? 'bg-[#eef3f8] text-muted' : item.replace ? 'bg-[#fdecec] text-[#c33d3d]' : 'bg-[#e8f6f0] text-[#167a52]'}`}>{item.replace !== undefined && <HomeIcon name={item.replace ? 'imgIndicador' : 'imgIndicador1'} source="epi" />}{item.replace === undefined ? 'Não informado' : item.replace ? 'Trocar' : 'Em uso'}</span></div>
    <div role="cell"><button type="button" aria-label={`Opções de ${item.name}`}><HomeIcon name="imgSimbolo17" source="epi" /></button></div>
  </div>;
}
