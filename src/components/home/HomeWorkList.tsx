import { useData } from '../../data/DataContext';
import { CollectionState } from '../shared/CollectionState';
import { WorkCard } from '../works/WorkCard';
export function HomeWorkList() {
  const { works } = useData();
  return <section aria-labelledby="home-works-title" className="flex flex-col gap-4">
    <h2 id="home-works-title" className="text-lg font-bold">Suas obras</h2>
    <CollectionState collection={works} empty="Nenhuma obra cadastrada" />
    {works.status === 'ready' && works.records.length > 0 && <div className="grid grid-cols-3 gap-5">{works.records.map(work => <WorkCard key={work.id} work={work} />)}</div>}
  </section>;
}
