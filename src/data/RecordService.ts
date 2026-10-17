export interface RecordService<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(record: Omit<T, 'id'>): Promise<T>;
  update(id: string, changes: Partial<Omit<T, 'id'>>): Promise<T>;
  delete(id: string): Promise<void>;
  subscribe?(listener: () => void): () => void;
}
