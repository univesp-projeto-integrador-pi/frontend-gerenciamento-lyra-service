import { useMemo, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DataProvider } from './DataContext';
import { createDataServices, type DataServices } from './createDataServices';
import { emptyService } from './AllocationService';
const guestServices: DataServices = { works: emptyService(), employees: emptyService(), documents: emptyService(), equipment: emptyService(), allocations: emptyService(), audit: emptyService() };
export function SessionDataProvider({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const api = import.meta.env.VITE_DATA_MODE === 'api';
  const waiting = api && (initializing || !user || user.precisaTrocarSenha);
  const scope = waiting ? 'guest' : [user?.id, user?.papel, user?.funcionarioId].join(':');
  const services = useMemo(() => waiting ? Promise.resolve(guestServices) : createDataServices(api && user ? user : undefined), [scope, api, waiting]);
  return <DataProvider key={scope} services={services}>{children}</DataProvider>;
}
