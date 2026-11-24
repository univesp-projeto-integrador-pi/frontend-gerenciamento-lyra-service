import { apiClient, ApiError } from '../api/ApiClient';
import { isUserRole } from '../users/UserService';
import type { AuthService, AuthUser, LoginCredentials } from './AuthService';
function decodeAuth(value: unknown): AuthUser {
  if (!value || typeof value !== 'object') throw new ApiError('Resposta de autenticação inválida.', 502);
  const user = value as Record<string, unknown>;
  if (!Number.isSafeInteger(user.id) || Number(user.id) <= 0 || typeof user.email !== 'string' || !isUserRole(user.papel) || typeof user.precisaTrocarSenha !== 'boolean' || (user.funcionarioId != null && (!Number.isSafeInteger(user.funcionarioId) || Number(user.funcionarioId) <= 0))) throw new ApiError('Resposta de autenticação inválida.', 502);
  return { id: String(user.id), email: user.email, name: user.email, papel: user.papel, precisaTrocarSenha: user.precisaTrocarSenha, funcionarioId: typeof user.funcionarioId === 'number' ? user.funcionarioId : null };
}
export class ApiAuthService implements AuthService {
  async login({ email, password }: LoginCredentials) {
    apiClient.resetSession();
    decodeAuth(await apiClient.request('/api/auth/login', 'POST', { email: email.trim().toLowerCase(), senha: password }));
    apiClient.clearCsrf();
    await apiClient.refreshCsrf();
    return decodeAuth(await apiClient.request('/api/auth/me'));
  }
  async getCurrentUser() {
    try { return decodeAuth(await apiClient.request('/api/auth/me')); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  }
  async logout() {
    await apiClient.request<void>('/api/auth/logout', 'POST');
    apiClient.resetSession();
    // AuthContext emits session-ended after committing logout; that event renews the anonymous CSRF token.
  }
  async changePassword(currentPassword: string, newPassword: string) {
    await apiClient.request<void>('/api/auth/trocar-senha', 'POST', { senhaAtual: currentPassword, novaSenha: newPassword });
    apiClient.resetSession();
    await apiClient.refreshCsrf();
    return decodeAuth(await apiClient.request('/api/auth/me'));
  }
}
