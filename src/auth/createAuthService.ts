import { AuthError, type AuthService } from './AuthService';
import { clearMockSession } from './mockSession';
class DisabledAuthService implements AuthService {
  async login(): Promise<never> {
    throw new AuthError('Autenticação indisponível neste ambiente.');
  }
  async logout(): Promise<void> {
    clearMockSession();
  }
  async getCurrentUser(): Promise<null> {
    await this.logout();
    return null;
  }
}
export async function createAuthService(): Promise<AuthService> {
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'mock') {
    const { MockAuthService } = await import('./MockAuthService');
    return new MockAuthService();
  }
  return new DisabledAuthService();
}
