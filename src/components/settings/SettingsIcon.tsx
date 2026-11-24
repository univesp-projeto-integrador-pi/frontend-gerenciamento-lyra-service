export type SettingsIconName = 'imgSimboloDaMarca' | 'imgSimbolo' | 'imgSimbolo1' | 'imgSimbolo2' | 'imgSimbolo3' | 'imgSimbolo4' | 'imgCircleHelp' | 'imgChevronsUpDown' | 'imgBuilding2' | 'imgBell' | 'imgInfo' | 'imgCheck';
export function SettingsIcon({ name }: { name: SettingsIconName }) {
  return <img src={'/assets/settings/' + name + '.svg'} alt="" aria-hidden="true" className="block shrink-0" />;
}
