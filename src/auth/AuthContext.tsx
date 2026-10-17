import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthService, AuthUser, LoginCredentials } from './AuthService';
import { createAuthService } from './createAuthService';
interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const servicePromise = useRef<Promise<AuthService> | null>(null);
  if (!servicePromise.current) servicePromise.current = service ? Promise.resolve(service) : createAuthService();
  const adapter = servicePromise.current;
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    adapter.then(auth => auth.getCurrentUser()).then(current => { if (active) setUser(current); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, [adapter]);
  async function login(credentials: LoginCredentials) {
    const request = ++revision.current;
    const auth = await adapter;
    const current = await auth.login(credentials);
    if (request === revision.current) setUser(current);
    else await auth.logout();
  }
  async function logout() {
    ++revision.current;
    try { await (await adapter).logout(); }
    finally { setUser(null); }
  }
  return <AuthContext.Provider value={{ user, initializing, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return auth;
}
