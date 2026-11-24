import { useData } from '../../data/DataContext';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PendingBadge, type HomeIconName } from './HomeIcon';
import { ProfileMenu } from './ProfileMenu';
import { useAuth } from '../../auth/AuthContext';
import { SettingsIcon } from '../settings/SettingsIcon';
const areas: { label: string; icon: HomeIconName }[] = [
  { label: 'Visão geral', icon: 'imgLayoutDashboard' },
  { label: 'Obras', icon: 'imgSimbolo1' },
  { label: 'Funcionários', icon: 'imgSimbolo2' },
  { label: 'Docs', icon: 'imgSimbolo3' },
  { label: 'EPI', icon: 'imgSimbolo4' },
];
export function Sidebar({ source = 'home' }: { source?: 'home' | 'works' | 'employees' | 'docs' | 'epi' }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const settings = pathname.startsWith('/configuracoes');
  const { documents, equipment } = useData();
  const pendingDocs = documents.status === 'ready' ? documents.records.filter(record => record.status !== 'Válido').length : 0;
  const pendingEquipment = equipment.status === 'ready' ? equipment.records.filter(record => record.replace === true).length : 0;
  const Icon = ({ name }: { name: HomeIconName }) => {
    if (settings) {
      if (name === 'imgLayoutDashboard') return <SettingsIcon name="imgSimbolo" />;
      if (name === 'imgSimbolo1') return <SettingsIcon name="imgSimbolo2" />;
      if (name === 'imgSimbolo2') return <span className="relative block size-5 shrink-0"><span className="absolute left-[3px] top-0"><SettingsIcon name="imgSimbolo1" /></span></span>;
      if (name === 'imgSimbolo3') return <span className="relative block size-5 shrink-0"><span className="absolute left-[6.666px] top-0"><SettingsIcon name="imgSimbolo3" /></span></span>;
      if (name === 'imgCircleHelp') return <SettingsIcon name="imgCircleHelp" />;
    }
    return <HomeIcon name={name} source={source} />;
  };
  return <aside className="relative flex min-h-[900px] w-[240px] shrink-0 flex-col gap-8 self-stretch border-r border-[#dce4ed] bg-white px-5 py-7">
    <div className="flex items-center gap-2.5">{settings ? <SettingsIcon name="imgSimboloDaMarca" /> : <div className="flex size-[38px] items-center justify-center rounded-[10px] bg-primary"><Icon name="imgSimbolo" /></div>}<span className="text-xl font-bold">CleanPro</span></div>
    <div className="flex flex-col gap-1 rounded-[10px] bg-[#f5f7fa] p-3"><p className="text-[11px] text-muted">ESPAÇO DE TRABALHO</p><p className="text-[13px] font-semibold">Construtora Viva</p></div>
    <nav aria-label="Gestão da obra" className="flex flex-col gap-1.5"><p className="text-[11px] font-semibold text-[#8a98aa]">GESTÃO DA OBRA</p>
      {areas.map((area, index) => {
        const to = index === 2 && user?.papel === 'FUNCIONARIO' ? user.funcionarioId ? `/funcionarios/${user.funcionarioId}` : '' : ['/home', '/obras', '/funcionarios', '/docs', '/epi'][index];
        if (!to) return null;
        const active = pathname === to || (to !== '/home' && pathname.startsWith(to + '/'));
        const content = <><Icon name={area.icon} /><span className="flex-1 text-left">{area.label}</span>{(index === 3 ? pendingDocs : index === 4 ? pendingEquipment : 0) > 0 && <PendingBadge count={index === 3 ? pendingDocs : pendingEquipment} />}</>;
        const classes = `flex h-12 w-full items-center gap-3 rounded-[10px] px-3 text-sm ${active ? 'bg-[#e8f2fc] font-bold text-primary' : 'font-medium text-muted'}`;
        return to ? <Link key={area.label} to={to} aria-current={active ? 'page' : undefined} className={classes}>{content}</Link> : <button key={area.label} type="button" className={classes}>{content}</button>;
      })}
      {user?.papel === 'ADMIN' && <Link to="/configuracoes/usuarios" aria-current={settings ? 'page' : undefined} className={`flex h-12 w-full items-center gap-3 rounded-[10px] px-3 text-sm ${settings ? 'bg-[#e8f2fc] font-bold text-primary' : 'font-medium text-muted'}`}><SettingsIcon name="imgSimbolo4" />Configurações</Link>}
    </nav>
    <div className="absolute bottom-6 left-5 flex w-[200px] flex-col gap-5">
      <button type="button" className="flex items-center gap-2.5 text-[13px] text-muted"><Icon name="imgCircleHelp" />Falar com o suporte</button>
      <div className="h-px bg-[#e8edf3]" />
      <ProfileMenu key={pathname} source={source} settings={settings} />
    </div>
  </aside>;
}
