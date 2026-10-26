import type { RecordService } from './RecordService';
import type { WorkService } from './WorkService';
import type { Employee, DocumentRecord, EquipmentItem } from './models';
export interface DataServices {
  works: WorkService;
  employees: RecordService<Employee>;
  documents: RecordService<DocumentRecord>;
  equipment: RecordService<EquipmentItem>;
}
class UnavailableService<T extends { id: string }> implements RecordService<T> {
  private fail(): never { throw new Error('Fonte de dados indisponível neste ambiente.'); }
  async getAll(): Promise<T[]> { return this.fail(); }
  async getById(): Promise<T | undefined> { return this.fail(); }
  async create(): Promise<T> { return this.fail(); }
  async update(): Promise<T> { return this.fail(); }
  async delete(): Promise<void> { return this.fail(); }
}
let services: Promise<DataServices> | undefined;
export function createDataServices(): Promise<DataServices> {
  return services ??= buildServices();
}
async function buildServices(): Promise<DataServices> {
  if (import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'local') {
    const [{ MockWorkService }, { LocalRecordService }, validators] = await Promise.all([import('./MockWorkService'), import('./LocalRecordService'), import('./validation')]);
    return {
      works: new MockWorkService(),
      employees: new LocalRecordService('cleanpro.employees', validators.isEmployee),
      documents: new LocalRecordService('cleanpro.documents', validators.isDocument),
      equipment: new LocalRecordService('cleanpro.equipment', validators.isEquipment),
    };
  }
  return { works: new UnavailableService(), employees: new UnavailableService(), documents: new UnavailableService(), equipment: new UnavailableService() };
}
