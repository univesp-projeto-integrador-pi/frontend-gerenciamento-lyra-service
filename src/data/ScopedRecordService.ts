import { ApiError } from '../api/ApiClient';
import type { RecordService } from './RecordService';
/** UI guard only. The server remains the authorization authority. */
export class ScopedRecordService<T extends { id: string }> implements RecordService<T> {
  constructor(private source: RecordService<T>, private read: boolean, private write: boolean, private ownId?: string | null) {}
  private assertRead() { if (!this.read) throw new ApiError('Consulta indisponível para o perfil autenticado.', 403); }
  private assertWrite() { if (!this.write) throw new ApiError('Você não tem permissão para esta operação.', 403); }
  async getAll() { this.assertRead(); if (this.ownId === null) throw new ApiError('Esta conta não possui funcionário vinculado.', 403); if (this.ownId !== undefined) { const record = await this.source.getById(this.ownId); return record ? [record] : []; } return this.source.getAll(); }
  async getById(id: string) { this.assertRead(); if (this.ownId !== undefined && id !== this.ownId) throw new ApiError('Registro não encontrado.', 404); return this.source.getById(id); }
  async create(input: Omit<T, 'id'>) { this.assertWrite(); return this.source.create(input); }
  async update(id: string, input: Partial<Omit<T, 'id'>>) { this.assertWrite(); return this.source.update(id, input); }
  async delete(id: string) { this.assertWrite(); return this.source.delete(id); }
  subscribe(listener: () => void) { return this.source.subscribe?.(listener) ?? (() => {}); }
}
