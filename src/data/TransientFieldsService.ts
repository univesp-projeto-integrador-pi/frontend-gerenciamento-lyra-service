import type { RecordService } from './RecordService';
/** Personal information exists only in memory during a development session. */
export class TransientFieldsService<T extends { id: string }> implements RecordService<T> {
  private values = new Map<string, Partial<T>>();
  constructor(private source: RecordService<T>, private fields: (keyof T)[]) { window.addEventListener('lyra:session-ended', () => { this.values.clear(); this.notify(); }); }
  private split(input: Partial<T>) {
    const persisted = { ...input }; const temporary: Partial<T> = {};
    for (const key of this.fields) { if (key in persisted) { temporary[key] = persisted[key]; delete persisted[key]; } }
    return { persisted, temporary };
  }
  private merge(record: T): T { return { ...record, ...this.values.get(record.id) }; }
  async getAll() { return (await this.source.getAll()).map(record => this.merge(record)); }
  async getById(id: string) { const result = await this.source.getById(id); return result && this.merge(result); }
  async create(input: Omit<T, 'id'>) {
    const { persisted, temporary } = this.split(input as Partial<T>);
    const result = await this.source.create(persisted as Omit<T, 'id'>);
    this.values.set(result.id, temporary); this.notify(); return this.merge(result);
  }
  async update(id: string, input: Partial<Omit<T, 'id'>>) {
    const { persisted, temporary } = this.split(input as Partial<T>);
    const result = await this.source.update(id, persisted);
    this.values.set(id, { ...this.values.get(id), ...temporary }); this.notify(); return this.merge(result);
  }
  async delete(id: string) { await this.source.delete(id); this.values.delete(id); }
  private listeners = new Set<() => void>();
  private notify() { for (const listener of this.listeners) listener(); }
  subscribe(listener: () => void) { this.listeners.add(listener); const unsubscribe = this.source.subscribe?.(listener); return () => { this.listeners.delete(listener); unsubscribe?.(); }; }
}
