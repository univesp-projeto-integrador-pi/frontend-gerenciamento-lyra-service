import { apiClient, ApiClient, ApiError, requireApiConfiguration } from '../api/ApiClient';
import { notifyApiChange } from '../api/changes';
import { isUserRole, type CreateUserInput, type UpdateUserInput, type UserService, type Usuario } from './UserService';
export function validateUserInput(input: CreateUserInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.email?.trim() && input.funcionarioId === undefined) errors.email = 'Informe o e-mail ou o ID de um funcionário.';
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'E-mail inválido.';
  if (input.funcionarioId !== undefined && (!Number.isSafeInteger(input.funcionarioId) || input.funcionarioId <= 0)) errors.funcionarioId = 'Informe um ID de funcionário válido.';
  if (!isUserRole(input.papel)) errors.papel = 'Selecione um papel válido.';
  if (input.senhaTemporaria.length < 10 || input.senhaTemporaria.length > 128) errors.senhaTemporaria = 'A senha temporária deve ter de 10 a 128 caracteres.';
  return errors;
}
function decodeUser(value: unknown): Usuario {
  if (!value || typeof value !== 'object') throw new ApiError('Resposta de usuário inválida.', 502);
  const user = value as Record<string, unknown>;
  if (!Number.isSafeInteger(user.id) || Number(user.id) <= 0 || typeof user.email !== 'string' || !isUserRole(user.papel) || typeof user.ativo !== 'boolean' || typeof user.precisaTrocarSenha !== 'boolean' || typeof user.criadoEm !== 'string') throw new ApiError('Resposta de usuário inválida.', 502);
  const employee = user.funcionario as { id?: unknown; nome?: unknown } | null;
  if (employee !== null && (!employee || !Number.isSafeInteger(employee.id) || typeof employee.nome !== 'string')) throw new ApiError('Vínculo de funcionário inválido.', 502);
  return { id: Number(user.id), email: user.email, papel: user.papel, ativo: user.ativo, precisaTrocarSenha: user.precisaTrocarSenha, criadoEm: user.criadoEm, bloqueadoAte: typeof user.bloqueadoAte === 'string' ? user.bloqueadoAte : null, funcionario: employee ? { id: Number(employee.id), nome: String(employee.nome) } : null };
}
export class ApiUserService implements UserService {
  constructor(private readonly client: ApiClient = apiClient, private readonly checkConfiguration = requireApiConfiguration) {}
  async getAll() {
    this.checkConfiguration();
    const data = await this.client.request<unknown>('/api/usuarios');
    if (!Array.isArray(data)) throw new ApiError('Resposta da listagem inválida.', 502);
    return data.map(decodeUser);
  }
  async create(input: CreateUserInput) {
    this.checkConfiguration();
    if (Object.keys(validateUserInput(input)).length) throw new ApiError('Dados inválidos. Verifique os campos informados.', 400);
    const body: CreateUserInput = { papel: input.papel, senhaTemporaria: input.senhaTemporaria };
    if (input.email?.trim()) body.email = input.email.trim().toLowerCase();
    if (input.funcionarioId !== undefined) body.funcionarioId = input.funcionarioId;
    const result = decodeUser(await this.client.request('/api/usuarios', 'POST', body)); notifyApiChange('/api/usuarios'); return result;
  }
  async update(id: number, input: UpdateUserInput) {
    this.checkConfiguration(); this.validateId(id);
    const body: UpdateUserInput = {};
    if (input.papel !== undefined) { if (!isUserRole(input.papel)) throw new ApiError('Papel inválido.', 400); body.papel = input.papel; }
    if (input.ativo !== undefined) { if (typeof input.ativo !== 'boolean') throw new ApiError('Situação inválida.', 400); body.ativo = input.ativo; }
    if (!Object.keys(body).length) throw new ApiError('Informe ao menos um campo.', 400);
    const result = decodeUser(await this.client.request('/api/usuarios/' + id, 'PATCH', body)); notifyApiChange('/api/usuarios'); return result;
  }
  async resetPassword(id: number, senhaTemporaria: string) {
    this.checkConfiguration(); this.validateId(id);
    if (senhaTemporaria.length < 10 || senhaTemporaria.length > 128) throw new ApiError('A senha temporária deve ter de 10 a 128 caracteres.', 400);
    await this.client.request<void>('/api/usuarios/' + id + '/redefinir-senha', 'POST', { senhaTemporaria }); notifyApiChange('/api/usuarios');
  }
  private validateId(id: number) { if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError('ID de usuário inválido.', 400); }
}
