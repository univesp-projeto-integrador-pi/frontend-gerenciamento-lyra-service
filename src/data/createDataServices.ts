import type { AuthUser } from '../auth/AuthService';
import type { RecordService } from './RecordService';
import type { WorkService } from './WorkService';
import type { Employee, DocumentRecord, EquipmentItem, Allocation, AuditEvent } from './models';
export interface DataServices {
  works: WorkService;
  employees: RecordService<Employee>;
  documents: RecordService<DocumentRecord>;
  equipment: RecordService<EquipmentItem>;
  allocations?: RecordService<Allocation>;
  audit?: RecordService<AuditEvent>;
}
class UnavailableService<T extends { id: string }> implements RecordService<T> {
  constructor(private message = 'Fonte de dados indisponível neste ambiente.') {}
  private fail(): never { throw new Error(this.message); }
  async getAll(): Promise<T[]> { return this.fail(); }
  async getById(): Promise<T | undefined> { return this.fail(); }
  async create(): Promise<T> { return this.fail(); }
  async update(): Promise<T> { return this.fail(); }
  async delete(): Promise<void> { return this.fail(); }
}
let services: Promise<DataServices> | undefined;
export function createDataServices(user?: AuthUser): Promise<DataServices> {
  if (user && import.meta.env.VITE_DATA_MODE === 'api') return buildServices(user);
  return services ??= buildServices();
}
async function buildServices(user?: AuthUser): Promise<DataServices> {
  if (import.meta.env.VITE_DATA_MODE === 'api') {
    const { apiWorks, apiEmployees, apiAllocations, ApiAuditService } = await import('./ApiRecordServices');
    const { ScopedRecordService } = await import('./ScopedRecordService');
    const admin = !user || user.papel === 'ADMIN'; const manager = admin || user?.papel === 'GESTOR';
    return { works: new ScopedRecordService(apiWorks, true, manager), employees: new ScopedRecordService(apiEmployees, true, admin, user?.papel === 'FUNCIONARIO' ? user.funcionarioId ? String(user.funcionarioId) : null : undefined), allocations: new ScopedRecordService(apiAllocations, true, manager), audit: new ScopedRecordService(new ApiAuditService(), admin, false), documents: new UnavailableService('A API ainda não possui endpoints de documentos. Use o modo local de desenvolvimento para testar o formulário.'), equipment: new UnavailableService('A API ainda não possui endpoints de EPI.') };
  }
  if (import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'local' && import.meta.env.VITE_AUTH_MODE === 'mock') {
    const [{ MockWorkService }, { LocalRecordService }, validators] = await Promise.all([import('./MockWorkService'), import('./LocalRecordService'), import('./validation')]);
    const { TransientFieldsService } = await import('./TransientFieldsService');
    const { AuditedRecordService } = await import('./AuditedRecordService');
    const audit = new LocalRecordService('cleanpro.audit', validators.isAudit);
    return {
      works: new AuditedRecordService(new TransientFieldsService(new MockWorkService(), ['engineerPhone', 'adminPhone']), audit, 'Obra'),
      employees: new AuditedRecordService(new TransientFieldsService(new LocalRecordService('cleanpro.employees', validators.isEmployee), ['cpf', 'birthDate', 'phone', 'address', 'photo', 'email', 'salary']), audit, 'Funcionario'),
      documents: new AuditedRecordService(new TransientFieldsService(new LocalRecordService('cleanpro.documents', validators.isDocument), ['notes']), audit, 'Documento'),
      equipment: new LocalRecordService('cleanpro.equipment', validators.isEquipment),
      allocations: new AuditedRecordService(new LocalRecordService('cleanpro.allocations', validators.isAllocation), audit, 'Alocacao'),
      audit,
    };
  }
  return { works: new UnavailableService(), employees: new UnavailableService(), documents: new UnavailableService(), equipment: new UnavailableService(), allocations: new UnavailableService(), audit: new UnavailableService() };
}
