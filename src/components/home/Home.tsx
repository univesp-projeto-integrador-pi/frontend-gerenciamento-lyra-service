import '@fontsource/inter/500.css';
import { Sidebar } from './Sidebar';
import { HomeHeader, PageHeading } from './HomeHeader';
import { Metrics, Management } from './Overview';
import { Monitoring } from './Monitoring';
import { HomeWorkList } from './HomeWorkList';
export function Home() {
  return <div className="home-screen flex min-h-[900px] min-w-[1200px] bg-[#f5f7fa] leading-[1.45] text-ink">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col"><HomeHeader /><main className="flex flex-col gap-6 p-8"><PageHeading /><Metrics /><div className="flex items-start gap-6"><Management /><Monitoring /></div><HomeWorkList /></main></div>
  </div>;
}
