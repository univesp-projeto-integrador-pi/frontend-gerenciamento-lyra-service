import type { RecordService } from './RecordService';
import type { AuditEvent } from './models';
/** Audit metadata deliberately excludes record values and personal fields. */
export class AuditedRecordService<T extends { id: string }> implements RecordService<T> {
  constructor(private source: RecordService<T>, private audit: RecordService<AuditEvent>, private resource: string) {}
  getAll() { return this.source.getAll(); }
  getById(id: string) { return this.source.getById(id); }
  subscribe(listener: () => void) { return this.source.subscribe?.(listener) ?? (() => {}); }
  private async log(action: string, resourceId: string) { try { await this.audit.create({ action, resource: this.resource, resourceId, createdAt: new Date().toISOString() }); } catch { window.dispatchEvent(new Event('lyra:audit-unavailable')); } }
  async create(input: Omit<T, 'id'>) { const result = await this.source.create(input); await this.log('Cadastro', result.id); return result; }
  async update(id: string, input: Partial<Omit<T, 'id'>>) { const result = await this.source.update(id, input); await this.log('Edição', id); return result; }
  async delete(id: string) { await this.source.delete(id); await this.log('Exclusão', id); }
}
