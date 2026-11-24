import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createDataServices, type DataServices } from './createDataServices';
import type { RecordService } from './RecordService';
import { emptyService } from './AllocationService';
import type { Allocation, AuditEvent } from './models';
import { documentStatus } from './documentRules';
import { allocationCurrent } from './allocationDates';
export interface Collection<T> {
  records: T[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  refresh(): void;
}
function useCollection<T extends { id: string }>(services: Promise<DataServices>, select: (services: DataServices) => RecordService<T>): Collection<T> {
  const [state, setState] = useState<Omit<Collection<T>, 'refresh'>>({ records: [], status: 'loading', error: null });
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribe: (() => void) | undefined;
    async function reload(service: RecordService<T>) {
      const request = ++generation;
      setState(current => ({ ...current, status: 'loading', error: null }));
      try {
        const records = await service.getAll();
        if (active && request === generation) setState({ records, status: 'ready', error: null });
      } catch (error) {
        if (active && request === generation) setState({ records: [], status: 'error', error: error instanceof Error ? error.message : 'Não foi possível consultar os registros.' });
      }
    }
    services.then(all => {
      if (!active) return;
      const service = select(all);
      refresh.current = () => { void reload(service); };
      unsubscribe = service.subscribe?.(refresh.current);
      refresh.current();
    }).catch(() => { if (active) setState({ records: [], status: 'error', error: 'Não foi possível iniciar a fonte de dados.' }); });
    return () => { active = false; unsubscribe?.(); refresh.current = () => {}; };
  }, [services, select]);
  return { ...state, refresh: () => refresh.current() };
}
const selectWorks = (services: DataServices) => services.works;
const selectEmployees = (services: DataServices) => services.employees;
const selectDocuments = (services: DataServices) => services.documents;
const selectEquipment = (services: DataServices) => services.equipment;
const noAllocations = emptyService<Allocation>();
const noAudit = emptyService<AuditEvent>();
const selectAllocations = (services: DataServices) => services.allocations ?? noAllocations;
const selectAudit = (services: DataServices) => services.audit ?? noAudit;
function useCollections(services: Promise<DataServices>) {
  const documents = useCollection(services, selectDocuments);
  const works = useCollection(services, selectWorks); const employees = useCollection(services, selectEmployees); const allocations = useCollection(services, selectAllocations);
  const mappedEmployees = employees.records.map(v => { const links = allocations.records.filter(a => a.employeeId === v.id && allocationCurrent(a)); return allocations.status === 'ready' && works.status === 'ready' && links.length ? { ...v, work: links.map(a => works.records.find(w => w.id === a.workId)?.name).filter(Boolean).join(', ') || v.work } : v; });
  const mappedWorks = works.records.map(v => { const links = allocations.records.filter(a => a.workId === v.id); return import.meta.env.VITE_DATA_MODE !== 'api' && allocations.status === 'ready' && links.length ? { ...v, workers: links.filter(allocationCurrent).length } : v; });
  return { works: { ...works, records: mappedWorks }, employees: { ...employees, records: mappedEmployees }, documents: { ...documents, records: documents.records.map(v => v.expiryDate ? { ...v, status: documentStatus(v.expiryDate) } : v) }, equipment: useCollection(services, selectEquipment), allocations, audit: useCollection(services, selectAudit), services };
}
const DataContext = createContext<ReturnType<typeof useCollections> | undefined>(undefined);
export function DataProvider({ children, services }: { children: ReactNode; services?: DataServices | Promise<DataServices> }) {
  const [source] = useState(() => services ? Promise.resolve(services) : createDataServices());
  const collections = useCollections(source);
  return <DataContext.Provider value={collections}>{children}</DataContext.Provider>;
}
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error('useData deve ser utilizado dentro de DataProvider.');
  return data;
}
