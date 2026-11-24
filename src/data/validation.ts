import type { Work, Employee, DocumentRecord, EquipmentItem, Address, Allocation, AuditEvent } from './models';
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const optionalText = (value: unknown) => value === undefined || text(value);
const optionalBoolean = (value: unknown) => value === undefined || typeof value === 'boolean';
const fields = (value: ObjectValue, names: string[]) => names.every(name => text(value[name]));
const optionalStrings = (value: ObjectValue, keys: string[]) => keys.every(k => value[k] === undefined || typeof value[k] === 'string');
const isAddress = (value: unknown): value is Address => object(value) && ['cep', 'street', 'number', 'complement', 'district', 'city'].every(k => typeof value[k] === 'string');
const optionalDate = (value: unknown) => value === undefined || value === '' || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
export function isWork(value: unknown): value is Work {
  if (!object(value) || !fields(value, ['id', 'name'])) return false;
  return ['location', 'manager'].every(key => optionalText(value[key]))
    && optionalStrings(value, ['nickname', 'code', 'company', 'engineer', 'engineerPhone', 'admin', 'adminPhone', 'reason', 'closedBy'])
    && ['startDate', 'endDate', 'closedDate'].every(k => optionalDate(value[k]))
    && (value.state === undefined || ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'INTERROMPIDA'].includes(String(value.state)))
    && (value.addresses === undefined || Array.isArray(value.addresses) && value.addresses.every(isAddress))
    && (value.progress === undefined || (typeof value.progress === 'number' && Number.isFinite(value.progress) && value.progress >= 0 && value.progress <= 100))
    && (value.workers === undefined || (typeof value.workers === 'number' && Number.isInteger(value.workers) && value.workers >= 0))
    && optionalBoolean(value.attention) && optionalBoolean(value.active)
    && (value.inspectionDate === undefined || (typeof value.inspectionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.inspectionDate) && !Number.isNaN(Date.parse(value.inspectionDate)) && new Date(value.inspectionDate).toISOString().slice(0, 10) === value.inspectionDate));
}
export function isEmployee(value: unknown): value is Employee {
  return object(value) && fields(value, ['id', 'name', 'role', 'work', 'record']) && ['Em campo', 'Pendente', 'Ausente'].includes(String(value.status)) && optionalBoolean(value.active) && optionalStrings(value, ['email', 'cpf', 'phone', 'photo', 'schedule']) && ['admissionDate', 'dismissalDate', 'birthDate'].every(k => optionalDate(value[k])) && (value.address === undefined || isAddress(value.address));
}
export function isDocument(value: unknown): value is DocumentRecord {
  return object(value) && fields(value, ['id', 'title', 'type', 'collaborator', 'validity', 'owner']) && ['Vencido', 'Atenção', 'Válido'].includes(String(value.status)) && optionalStrings(value, ['employeeId', 'notes']) && ['issueDate', 'expiryDate'].every(k => optionalDate(value[k])) && (value.workIds === undefined || Array.isArray(value.workIds) && value.workIds.every(text));
}
export function isAllocation(value: unknown): value is Allocation { return object(value) && fields(value, ['id', 'employeeId', 'workId', 'startDate']) && optionalDate(value.startDate) && optionalDate(value.endDate) && optionalStrings(value, ['reason', 'createdAt']); }
export function isAudit(value: unknown): value is AuditEvent { return object(value) && fields(value, ['id', 'action', 'createdAt']) && Number.isFinite(Date.parse(String(value.createdAt))) && optionalStrings(value, ['userId', 'resource', 'resourceId']); }
export function isEquipment(value: unknown): value is EquipmentItem {
  return object(value) && fields(value, ['id', 'name', 'ca', 'employee', 'condition', 'owner']) && ['helmet', 'glasses', 'harness', 'hearing'].includes(String(value.kind)) && optionalBoolean(value.replace) && optionalBoolean(value.stockLow);
}
