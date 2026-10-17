export type HomeIconName = 'imgSimbolo' | 'imgLayoutDashboard' | 'imgCircleHelp' | 'imgIndicador' | 'imgIndicador1' | 'imgIndicador2' | 'imgChartNoAxesCombined' | `imgSimbolo${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21}`;
export function HomeIcon({ name, source = 'home' }: { name: HomeIconName; source?: 'home' | 'works' | 'employees' | 'docs' | 'epi' }) {
  return <img src={`/assets/${source}/${name}.svg`} alt="" aria-hidden="true" className="block shrink-0" />;
}
export function PendingBadge({ count }: { count: number }) {
  return <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#c33d3d] text-[11px] font-bold text-white">{count}</span>;
}
