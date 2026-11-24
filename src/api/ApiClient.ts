import { AuthError } from '../auth/AuthService';
import { apiOrigin } from './config';
export type ApiErrorKind = 'http' | 'network' | 'csrf' | 'invalid-response' | 'cancelled' | 'configuration';
export class ApiError extends AuthError {
  constructor(message: string, public readonly status: number, public readonly kind: ApiErrorKind = 'http') { super(message); this.name = 'ApiError'; }
}
export class ApiClient {
  private token?: string;
  private tokenRequest?: Promise<string>;
  private csrfVersion = 0;
  private sessionVersion = 0;
  private sessionAbort = new AbortController();
  constructor(private readonly baseUrl: string | (() => string)) {}
  resetSession() {
    this.sessionVersion++;
    this.sessionAbort.abort();
    this.sessionAbort = new AbortController();
    this.clearCsrf();
  }
  clearCsrf() { this.csrfVersion++; this.token = undefined; this.tokenRequest = undefined; }
  private async send(path: string, options: RequestInit) {
    if (!path.startsWith('/api/') || path.startsWith('//') || path.includes('://')) throw new ApiError('Caminho de API inválido.', 0, 'configuration');
    let base: string;
    try { base = typeof this.baseUrl === 'function' ? this.baseUrl() : this.baseUrl; }
    catch { throw new ApiError('VITE_API_URL deve ser a origem HTTP(S) da API, sem /api ou credenciais.', 0, 'configuration'); }
    try {
      return await fetch(base.replace(/\/$/, '') + path, { ...options, credentials: 'include', cache: 'no-store', signal: this.sessionAbort.signal });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw new ApiError('Operação interrompida por alteração da sessão. Consulte os dados antes de tentar novamente.', 0, 'cancelled');
      throw new ApiError('Não foi possível conectar à API. Verifique a configuração e tente novamente.', 0, 'network');
    }
  }
  async refreshCsrf(): Promise<string> {
    if (this.tokenRequest) return this.tokenRequest;
    this.token = undefined;
    const version = this.csrfVersion;
    const request = (async () => {
      const response = await this.send('/api/csrf-token', { method: 'GET' });
      let data: unknown;
      try { data = await response.json(); } catch { throw new ApiError('Resposta inválida da API.', 502, 'invalid-response'); }
      if (!response.ok) throw new ApiError(response.status === 429 ? 'Muitas tentativas. Aguarde e tente novamente.' : 'Não foi possível iniciar a sessão segura.', response.status);
      if (!data || typeof data !== 'object' || !('token' in data) || typeof data.token !== 'string' || !data.token) throw new ApiError('Resposta inválida da API.', 502, 'invalid-response');
      if (version !== this.csrfVersion) throw new ApiError('A sessão mudou. Tente novamente.', 0, 'cancelled');
      return this.token = data.token;
    })();
    this.tokenRequest = request;
    try { return await request; } finally { if (this.tokenRequest === request) this.tokenRequest = undefined; }
  }
  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    method = method.toUpperCase();
    const version = this.sessionVersion;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = this.token ?? await this.refreshCsrf();
    if (version !== this.sessionVersion) throw new ApiError('A sessão mudou. Tente novamente.', 0, 'cancelled');
    const response = await this.send(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (version !== this.sessionVersion) throw new ApiError('A sessão mudou. Tente novamente.', 0, 'cancelled');
    let data: unknown;
    let invalidJson = false;
    if (response.status !== 204 && method !== 'HEAD') {
      const raw = await response.text();
      if (raw) { try { data = JSON.parse(raw); } catch { invalidJson = true; } }
      else if (response.ok) invalidJson = true;
    }
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : '';
      if (response.status === 403 && /csrf/i.test(message)) {
        this.clearCsrf();
        throw new ApiError('A sessão segura expirou. Tente novamente.', 403, 'csrf');
      }
      if (response.status === 401 && path !== '/api/auth/login') window.dispatchEvent(new Event('lyra:session-expired'));
      if (response.status === 403 && message === 'Troque a senha provisória antes de continuar.') window.dispatchEvent(new Event('lyra:password-change-required'));
      const safe = ['Já existe um funcionário com este e-mail.', 'Funcionário já está alocado nesta obra.', 'Já existe um usuário com este e-mail.', 'Este funcionário já possui um usuário.', 'Funcionário não encontrado.', 'Você não pode desativar nem rebaixar a própria conta.', 'Você não pode excluir o seu próprio cadastro.', 'Para a própria conta, use a troca de senha.', 'Senha atual incorreta.', 'Troque a senha provisória antes de continuar.'];
      const messages: Record<number, string> = { 400: 'Dados inválidos. Verifique os campos informados.', 401: path === '/api/auth/login' ? 'Credenciais inválidas.' : 'Sessão expirada. Entre novamente.', 403: 'Você não tem permissão para esta operação.', 404: 'Registro não encontrado.', 409: 'Os dados informados já estão em uso.', 413: 'Os dados excedem o tamanho permitido.', 429: 'Muitas tentativas. Aguarde e tente novamente.' };
      throw new ApiError(safe.includes(message) ? message : messages[response.status] ?? 'Não foi possível concluir a operação.', response.status);
    }
    if (invalidJson) throw new ApiError('Resposta inválida da API.', 502, 'invalid-response');
    return data as T;
  }
}
export const apiClient = new ApiClient(apiOrigin);
window.addEventListener('lyra:session-ended', () => { apiClient.resetSession(); if (import.meta.env.VITE_AUTH_MODE === 'api') void apiClient.refreshCsrf().catch(() => {}); });
export function requireApiConfiguration() {
  if (import.meta.env.VITE_AUTH_MODE !== 'api') throw new ApiError('Configure VITE_AUTH_MODE=api e VITE_API_URL para acessar a API. O login mock não autentica no backend.', 0, 'configuration');
}
