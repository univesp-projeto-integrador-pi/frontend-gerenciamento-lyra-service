import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createDataServices, type DataServices } from './createDataServices';
import type { RecordService } from './RecordService';
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
function useCollections(services: Promise<DataServices>) {
  return { works: useCollection(services, selectWorks), employees: useCollection(services, selectEmployees), documents: useCollection(services, selectDocuments), equipment: useCollection(services, selectEquipment) };
}
const DataContext = createContext<ReturnType<typeof useCollections> | undefined>(undefined);
export function DataProvider({ children, services }: { children: ReactNode; services?: DataServices }) {
  const [source] = useState(() => services ? Promise.resolve(services) : createDataServices());
  const collections = useCollections(source);
  return <DataContext.Provider value={collections}>{children}</DataContext.Provider>;
}
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error('useData deve ser utilizado dentro de DataProvider.');
  return data;
}
