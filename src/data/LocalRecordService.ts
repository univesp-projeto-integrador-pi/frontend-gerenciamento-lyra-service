import type { RecordService } from './RecordService';
const CHANGE_EVENT = 'cleanpro:records-changed';
export class LocalRecordService<T extends { id: string }> implements RecordService<T> {
  constructor(private readonly key: string, private readonly validate: (value: unknown) => value is T) {}
  private ensureDevelopment() {
    if (!import.meta.env.DEV) throw new Error('Armazenamento local disponível apenas em desenvolvimento.');
  }
  private read(): T[] {
    this.ensureDevelopment();
    let raw: string | null;
    try { raw = localStorage.getItem(this.key); }
    catch { throw new Error('Não foi possível acessar o armazenamento local.'); }
    if (raw === null) {
      this.write([]);
      return [];
    }
    let records: unknown;
    try { records = JSON.parse(raw); }
    catch { throw new Error('Os dados armazenados são inválidos. Nenhum registro foi apagado.'); }
    if (!Array.isArray(records) || !records.every(this.validate) || new Set(records.map(record => record.id)).size !== records.length) {
      throw new Error('Os registros armazenados são inválidos. Nenhum registro foi apagado.');
    }
    return records;
  }
  private write(records: T[]) {
    this.ensureDevelopment();
    try { localStorage.setItem(this.key, JSON.stringify(records)); }
    catch { throw new Error('Não foi possível salvar os registros no armazenamento local.'); }
  }
  private notify() { window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: this.key })); }
  async getAll(): Promise<T[]> { return this.read(); }
  async getById(id: string): Promise<T | undefined> { return this.read().find(record => record.id === id); }
  async create(input: Omit<T, 'id'>): Promise<T> {
    const records = this.read();
    const record = { ...input, id: crypto.randomUUID() };
    if (!this.validate(record)) throw new Error('Dados do registro inválidos.');
    this.write([...records, record]);
    this.notify();
    return record;
  }
  async update(id: string, changes: Partial<Omit<T, 'id'>>): Promise<T> {
    const records = this.read();
    const index = records.findIndex(record => record.id === id);
    if (index === -1) throw new Error('Registro não encontrado.');
    const record = { ...records[index], ...changes, id };
    if (!this.validate(record)) throw new Error('Dados do registro inválidos.');
    records[index] = record;
    this.write(records);
    this.notify();
    return record;
  }
  async delete(id: string): Promise<void> {
    const records = this.read();
    this.write(records.filter(record => record.id !== id));
    this.notify();
  }
  subscribe(listener: () => void) {
    const onChange = (event: Event) => { if ((event as CustomEvent<string>).detail === this.key) listener(); };
    const onStorage = (event: StorageEvent) => { if (event.storageArea === localStorage && (event.key === this.key || event.key === null)) listener(); };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(CHANGE_EVENT, onChange); window.removeEventListener('storage', onStorage); };
  }
}
