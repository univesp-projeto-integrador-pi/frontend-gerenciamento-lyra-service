import type { Collection } from '../../data/DataContext';
export function CollectionState<T>({ collection, empty }: { collection: Collection<T>; empty: string }) {
  if (collection.status === 'loading') return <p role="status" className="p-6 text-[13px] text-muted">Carregando registros…</p>;
  if (collection.status === 'error') return <div role="alert" className="p-6 text-[13px] text-[#c33d3d]"><p>{collection.error}</p><button type="button" className="mt-2 font-semibold text-primary" onClick={collection.refresh}>Tentar novamente</button></div>;
  if (!collection.records.length) return <p role="status" className="p-6 text-[13px] text-muted">{empty}</p>;
  return null;
}
