import type { Collection } from './DataContext';
import type { Work, Employee } from './models';
export function presenceCount(collection: Collection<Employee>, status: Employee['status'] = 'Em campo') { return import.meta.env.VITE_DATA_MODE === 'api' ? '—' : countFlag(collection, record => record.status === undefined ? undefined : record.status === status); }
export const countLabel = <T>(collection: Collection<T>, predicate: (record: T) => boolean = () => true): number | string => collection.status === 'ready' ? collection.records.filter(predicate).length : '—';
export function countFlag<T>(collection: Collection<T>, flag: (record: T) => boolean | undefined): number | string {
  if (collection.status !== 'ready' || !collection.records.every(record => flag(record) !== undefined)) return '—';
  return collection.records.filter(record => flag(record) === true).length;
}
export function workSummary(works: Work[]) {
  const complete = (field: 'active' | 'progress' | 'inspectionDate') => works.every(work => work[field] !== undefined);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    active: complete('active') ? works.filter(work => work.active === true).length : '—',
    progress: works.length && complete('progress') ? `${Math.round(works.reduce((sum, work) => sum + work.progress!, 0) / works.length)}%` : '—',
    inspections: import.meta.env.VITE_DATA_MODE !== 'api' && complete('inspectionDate') ? works.filter(work => work.inspectionDate === today).length : '—',
  };
}
