import { apiClient, ApiError, requireApiConfiguration } from '../api/ApiClient';
import { notifyApiChange, subscribeApiChanges } from '../api/changes';
import type { RecordService } from './RecordService';
import type { Allocation, AuditEvent, Employee, Work } from './models';
import type { CriarObraDto, CriarFuncionarioDto, SalvarAlocacaoDto, ObraStatusDto } from './apiModels';
import { normalizeSalary } from './money';
type Json = Record<string, unknown>;
const statuses = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
function object(value: unknown): Json { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('Resposta inválida da API.', 502); return value as Json; }
function text(value: unknown): string { if (typeof value !== 'string') throw new ApiError('Resposta inválida da API.', 502); return value; }
function id(value: unknown): string { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new ApiError('Identificador inválido na resposta.', 502); return String(value); }
const optional = (value: unknown) => value == null ? undefined : text(value);
function numericId(value: string) { if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('Identificador inválido.'); return Number(value); }
function list(value: unknown) { if (!Array.isArray(value)) throw new ApiError('Resposta inválida da API.', 502); return value; }
function isoDate(value: unknown): string { const result = text(value); if (!Number.isFinite(Date.parse(result))) throw new ApiError('Data inválida na resposta.', 502); return result; }
const dependencies: Record<string, string[]> = {
  '/api/obras': ['/api/obras', '/api/alocacoes', '/api/funcionarios'],
  '/api/funcionarios': ['/api/funcionarios', '/api/alocacoes', '/api/obras'],
  '/api/alocacoes': ['/api/alocacoes', '/api/funcionarios', '/api/obras'],
};
export class ApiRecordService<T extends { id: string }> implements RecordService<T> {
  private deletions = new Map<string, Promise<void>>();
  constructor(private path: string, private decode: (value: unknown) => T, private encode: (input: Partial<Omit<T, 'id'>>) => unknown) {}
  subscribe(listener: () => void) { return subscribeApiChanges(dependencies[this.path] ?? [this.path], listener); }
  async getAll() { requireApiConfiguration(); return list(await apiClient.request<unknown>(this.path)).map(this.decode); }
  async getById(key: string) { requireApiConfiguration(); try { return this.decode(await apiClient.request(this.path + '/' + numericId(key))); } catch (error) { if (error instanceof ApiError && error.status === 404) return undefined; throw error; } }
  async create(input: Omit<T, 'id'>) { requireApiConfiguration(); const record = this.decode(await apiClient.request(this.path, 'POST', this.encode(input))); notifyApiChange(this.path); return record; }
  async update(key: string, input: Partial<Omit<T, 'id'>>) { requireApiConfiguration(); const record = this.decode(await apiClient.request(this.path + '/' + numericId(key), 'PUT', this.encode(input))); notifyApiChange(this.path); return record; }
  delete(key: string): Promise<void> {
    const existing = this.deletions.get(key);
    if (existing) return existing;
    const operation = (async () => {
      requireApiConfiguration();
      await apiClient.request(this.path + '/' + numericId(key), 'DELETE');
      notifyApiChange(this.path);
    })();
    this.deletions.set(key, operation);
    void operation.finally(() => { if (this.deletions.get(key) === operation) this.deletions.delete(key); }).catch(() => {});
    return operation;
  }
}
export function decodeWork(value: unknown): Work {
  const v = object(value); const state = text(v.status);
  if (!statuses.includes(state)) throw new ApiError('Status de obra inválido.', 502);
  const team = v.alocacoes === undefined ? undefined : list(v.alocacoes);
  return { id: id(v.id), name: text(v.nome), location: optional(v.endereco), state: state as Work['state'], active: state === 'PLANEJADA' || state === 'EM_ANDAMENTO', startDate: v.dataInicio == null ? undefined : isoDate(v.dataInicio).slice(0, 10), endDate: v.dataFim == null ? undefined : isoDate(v.dataFim).slice(0, 10), workers: team?.length, workerMetric: 'allocated' };
}
export function decodeEmployee(value: unknown): Employee {
  const v = object(value);
  const links = v.alocacoes === undefined ? undefined : list(v.alocacoes);
  const works = links?.map(a => text(object(object(a).obra).nome)).join(', ');
  const salary = v.salario === null ? null : v.salario === undefined ? undefined : normalizeSalary(text(v.salario));
  return { id: id(v.id), name: text(v.nome), email: text(v.email), role: optional(v.cargo) ?? '', work: works === undefined ? 'Não informado' : works || 'Sem alocação', record: 'Não informado', ...(salary !== undefined && { salary }) };
}
export function decodeAllocation(value: unknown): Allocation {
  const v = object(value); const employee = v.funcionario == null ? undefined : object(v.funcionario); const work = v.obra == null ? undefined : object(v.obra);
  return { id: id(v.id), employeeId: id(v.funcionarioId), workId: id(v.obraId), createdAt: isoDate(v.criadoEm), source: 'api', employeeName: employee && text(employee.nome), employeeRole: employee && optional(employee.cargo), workName: work && text(work.nome), workState: work && text(work.status) };
}
function encodeWork(v: Partial<Omit<Work, 'id'>>): Partial<CriarObraDto> {
  if (v.state !== undefined && !statuses.includes(v.state)) throw new Error('Status não suportado pela API.');
  if (v.location !== undefined && v.location.length > 200) throw new Error('O endereço aceita até 200 caracteres.');
  return { ...(v.name !== undefined && { nome: v.name.trim() }), ...(v.location !== undefined && { endereco: v.location }), ...(v.state !== undefined && { status: v.state as ObraStatusDto }), ...(v.startDate && { dataInicio: v.startDate }), ...(v.endDate && { dataFim: v.endDate }) };
}
function encodeEmployee(v: Partial<Omit<Employee, 'id'>>): Partial<CriarFuncionarioDto> {
  return { ...(v.name !== undefined && { nome: v.name.trim() }), ...(v.email !== undefined && { email: v.email.trim() }), ...(v.role !== undefined && { cargo: v.role }), ...(v.salary != null && v.salary.trim() !== '' && { salario: normalizeSalary(v.salary) }) };
}
function encodeAllocation(v: Partial<Omit<Allocation, 'id'>>): SalvarAlocacaoDto { return { funcionarioId: numericId(v.employeeId ?? ''), obraId: numericId(v.workId ?? '') }; }
export class ApiWorkService extends ApiRecordService<Work> { constructor() { super('/api/obras', decodeWork, encodeWork); } }
export class ApiEmployeeService extends ApiRecordService<Employee> { constructor() { super('/api/funcionarios', decodeEmployee, encodeEmployee); } }
export class ApiAllocationService extends ApiRecordService<Allocation> { constructor() { super('/api/alocacoes', decodeAllocation, encodeAllocation); } }
export const apiWorks = new ApiWorkService();
export const apiEmployees = new ApiEmployeeService();
export const apiAllocations = new ApiAllocationService();
export class ApiAuditService implements RecordService<AuditEvent> {
  subscribe(listener: () => void) { return subscribeApiChanges(['*'], listener); }
  async getAll() { requireApiConfiguration(); return list(await apiClient.request<unknown>('/api/auditoria?limite=200')).map(raw => { const v = object(raw); return { id: id(v.id), userId: v.usuarioId == null ? undefined : id(v.usuarioId), action: text(v.acao), resource: optional(v.recurso), resourceId: v.recursoId == null ? undefined : String(v.recursoId), createdAt: isoDate(v.criadoEm), details: v.detalhes } satisfies AuditEvent; }); }
  async getById(key: string) { return (await this.getAll()).find(v => v.id === key); }
  async create(): Promise<AuditEvent> { throw new Error('Auditoria é somente leitura.'); }
  async update(): Promise<AuditEvent> { throw new Error('Auditoria é somente leitura.'); }
  async delete(): Promise<void> { throw new Error('Auditoria é somente leitura.'); }
}
