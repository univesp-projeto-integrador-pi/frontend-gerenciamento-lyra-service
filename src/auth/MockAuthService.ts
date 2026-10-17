import { AuthError, type AuthService, type AuthUser, type LoginCredentials } from './AuthService';
import { MOCK_SESSION_KEY as SESSION_KEY, clearMockSession } from './mockSession';
const TEST_ACCOUNT = {
  id: 'mock-admin',
  email: 'admin@teste.com',
  password: 'Admin123!',
  name: 'Administrador',
};
const unavailable = 'Autenticação indisponível neste ambiente.';
export class MockAuthService implements AuthService {
  private get enabled() {
    return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'mock';
  }
  async login({ email, password }: LoginCredentials): Promise<AuthUser> {
    if (!this.enabled) {
      clearMockSession();
      throw new AuthError(unavailable);
    }
    await new Promise(resolve => setTimeout(resolve, 350));
    if (email.trim().toLowerCase() !== TEST_ACCOUNT.email || password !== TEST_ACCOUNT.password) {
      throw new AuthError('E-mail ou senha incorretos.');
    }
    const user: AuthUser = { id: TEST_ACCOUNT.id, email: TEST_ACCOUNT.email, name: TEST_ACCOUNT.name };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  async logout(): Promise<void> {
    clearMockSession();
  }
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.enabled) {
      clearMockSession();
      return null;
    }
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      const user: unknown = JSON.parse(saved);
      if (typeof user === 'object' && user !== null && 'id' in user && 'email' in user && 'name' in user && user.id === TEST_ACCOUNT.id && user.email === TEST_ACCOUNT.email && user.name === TEST_ACCOUNT.name && Object.keys(user).length === 3) {
        return { id: TEST_ACCOUNT.id, email: TEST_ACCOUNT.email, name: TEST_ACCOUNT.name };
      }
    } catch { /* Sessões inválidas são descartadas. */ }
    clearMockSession();
    return null;
  }
}
