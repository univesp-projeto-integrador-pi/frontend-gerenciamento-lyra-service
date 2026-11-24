import type { Allocation } from './models';
import type { RecordService } from './RecordService';
import type { DataServices } from './createDataServices';
import { allocationEnded } from './allocationDates';
/** The API has no batch endpoint: successes remain saved when a later item fails. */
export async function allocateEmployees(services: DataServices, input: { workId: string; employeeIds: string[]; startDate: string; endDate?: string }) {
  if (!services.allocations) throw new Error('Fonte de alocações indisponível.');
  const existing = await services.allocations.getAll();
  const work = await services.works.getById(input.workId);
  if (!work || import.meta.env.VITE_DATA_MODE !== 'api' && work.active === false) throw new Error('Selecione uma obra ativa.');
  const results: Allocation[] = []; const failures: string[] = [];
  for (const employeeId of input.employeeIds) {
    try {
      const employee = await services.employees.getById(employeeId);
      if (!employee || import.meta.env.VITE_DATA_MODE !== 'api' && employee.active === false) throw new Error('Funcionário indisponível ou inativo.');
      if (existing.some(v => v.employeeId === employeeId && v.workId === input.workId && !allocationEnded(v))) throw new Error('Funcionário já está alocado nesta obra.');
      results.push(await services.allocations.create({ employeeId, workId: input.workId, startDate: input.startDate, ...(input.endDate && { endDate: input.endDate }) }));
    } catch (error) { failures.push(error instanceof Error ? error.message : 'Falha na alocação.'); }
  }
  if (failures.length) throw new Error(`${results.length} alocação(ões) salva(s). ${failures.join(' ')}`);
  return results;
}
export function emptyService<T extends { id: string }>(): RecordService<T> { return { async getAll() { return []; }, async getById() { return undefined; }, async create() { throw new Error('Operação indisponível.'); }, async update() { throw new Error('Operação indisponível.'); }, async delete() { throw new Error('Operação indisponível.'); } }; }
