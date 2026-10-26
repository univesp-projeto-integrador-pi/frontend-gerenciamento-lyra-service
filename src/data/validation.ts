import type { Work, Employee, DocumentRecord, EquipmentItem } from './models';
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const optionalText = (value: unknown) => value === undefined || text(value);
const optionalBoolean = (value: unknown) => value === undefined || typeof value === 'boolean';
const fields = (value: ObjectValue, names: string[]) => names.every(name => text(value[name]));
export function isWork(value: unknown): value is Work {
  if (!object(value) || !fields(value, ['id', 'name'])) return false;
  return ['location', 'manager'].every(key => optionalText(value[key]))
    && (value.progress === undefined || (typeof value.progress === 'number' && Number.isFinite(value.progress) && value.progress >= 0 && value.progress <= 100))
    && (value.workers === undefined || (typeof value.workers === 'number' && Number.isInteger(value.workers) && value.workers >= 0))
    && optionalBoolean(value.attention) && optionalBoolean(value.active)
    && (value.inspectionDate === undefined || (typeof value.inspectionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.inspectionDate) && !Number.isNaN(Date.parse(value.inspectionDate)) && new Date(value.inspectionDate).toISOString().slice(0, 10) === value.inspectionDate));
}
export function isEmployee(value: unknown): value is Employee {
  return object(value) && fields(value, ['id', 'name', 'role', 'work', 'record']) && ['Em campo', 'Pendente', 'Ausente'].includes(String(value.status));
}
export function isDocument(value: unknown): value is DocumentRecord {
  return object(value) && fields(value, ['id', 'title', 'type', 'collaborator', 'validity', 'owner']) && ['Vencido', 'Atenção', 'Válido'].includes(String(value.status));
}
export function isEquipment(value: unknown): value is EquipmentItem {
  return object(value) && fields(value, ['id', 'name', 'ca', 'employee', 'condition', 'owner']) && ['helmet', 'glasses', 'harness', 'hearing'].includes(String(value.kind)) && optionalBoolean(value.replace) && optionalBoolean(value.stockLow);
}
