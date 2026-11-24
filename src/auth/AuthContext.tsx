import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AuthError, type AuthService, type AuthUser, type LoginCredentials } from './AuthService';
import { createAuthService } from './createAuthService';
interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  sessionError: string | null;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  refreshSession(): Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const currentUser = useRef<AuthUser | null>(null);
  const servicePromise = useRef<Promise<AuthService> | null>(null);
  if (!servicePromise.current) servicePromise.current = service ? Promise.resolve(service) : createAuthService();
  const adapter = servicePromise.current;
  const revision = useRef(0);
  const commitUser = useCallback((next: AuthUser | null) => {
    const previous = currentUser.current;
    if (previous && (!next || previous.id !== next.id || previous.papel !== next.papel || previous.funcionarioId !== next.funcionarioId)) window.dispatchEvent(new Event('lyra:session-ended'));
    currentUser.current = next;
    setUser(next);
  }, []);
  useEffect(() => {
    const expire = () => { ++revision.current; commitUser(null); };
    const requirePassword = () => { if (currentUser.current) { ++revision.current; commitUser({ ...currentUser.current, precisaTrocarSenha: true }); } };
    window.addEventListener('lyra:session-expired', expire);
    window.addEventListener('lyra:password-change-required', requirePassword);
    return () => { window.removeEventListener('lyra:session-expired', expire); window.removeEventListener('lyra:password-change-required', requirePassword); };
  }, [commitUser]);
  useEffect(() => {
    let active = true;
    const request = revision.current;
    adapter.then(auth => auth.getCurrentUser()).then(current => {
      if (active && request === revision.current) commitUser(current);
    }).catch(cause => {
      if (active && request === revision.current) { commitUser(null); setSessionError(cause instanceof AuthError ? cause.message : 'Não foi possível verificar a sessão. Tente entrar novamente.'); }
    }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, [adapter, commitUser]);
  const refreshSession = useCallback(async () => {
    const request = revision.current;
    try { const current = await (await adapter).getCurrentUser(); if (request === revision.current) { commitUser(current); setSessionError(null); } }
    catch (cause) { if (request === revision.current) setSessionError(cause instanceof AuthError ? cause.message : 'Não foi possível verificar a sessão.'); }
  }, [adapter, commitUser]);
  useEffect(() => {
    if (import.meta.env.VITE_AUTH_MODE !== 'api' || !user) return;
    const refresh = () => { if (document.visibilityState === 'visible') void refreshSession(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [Boolean(user), refreshSession]);
  async function login(credentials: LoginCredentials) {
    const request = ++revision.current;
    setSessionError(null);
    const current = await (await adapter).login(credentials);
    if (request !== revision.current) throw new AuthError('A sessão mudou durante o login. Tente novamente.');
    commitUser(current);
  }
  async function logout() {
    const request = ++revision.current;
    await (await adapter).logout();
    if (request === revision.current) { commitUser(null); setSessionError(null); }
  }
  async function changePassword(currentPassword: string, newPassword: string) {
    const request = ++revision.current;
    const auth = await adapter;
    if (!auth.changePassword) throw new AuthError('Troca de senha disponível apenas para contas da API.');
    const current = await auth.changePassword(currentPassword, newPassword);
    if (request === revision.current) commitUser(current);
  }
  return <AuthContext.Provider value={{ user, initializing, sessionError, login, logout, changePassword, refreshSession }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return auth;
}
