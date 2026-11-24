export interface Work {
  id: string;
  name: string;
  location?: string;
  progress?: number;
  workers?: number;
  workerMetric?: 'allocated' | 'presence';
  manager?: string;
  attention?: boolean;
  active?: boolean;
  inspectionDate?: string;
  nickname?: string;
  code?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  state?: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'INTERROMPIDA';
  addresses?: Address[];
  engineer?: string;
  engineerPhone?: string;
  admin?: string;
  adminPhone?: string;
  closedDate?: string;
  closedBy?: string;
  reason?: string;
}
export type NewWork = Omit<Work, 'id'>;
export type WorkUpdate = Partial<NewWork>;
export interface Employee {
  id: string;
  name: string;
  role: string;
  work: string;
  record: string;
  status?: 'Em campo' | 'Pendente' | 'Ausente';
  salary?: string | null;
  email?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  address?: Address;
  photo?: string;
  admissionDate?: string;
  dismissalDate?: string;
  schedule?: string;
  active?: boolean;
}
export type DocumentStatus = 'Vencido' | 'Atenção' | 'Válido';
export interface DocumentRecord {
  id: string;
  title: string;
  type: string;
  collaborator: string;
  validity: string;
  owner: string;
  status: DocumentStatus;
  employeeId?: string;
  workIds?: string[];
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}
export interface Address { cep: string; street: string; number: string; complement: string; district: string; city: string }
export interface Allocation { id: string; employeeId: string; workId: string; startDate?: string; source?: 'api'; employeeName?: string; employeeRole?: string; workName?: string; workState?: string; endDate?: string; reason?: string; createdAt?: string }
export interface AuditEvent { id: string; userId?: string; action: string; resource?: string; resourceId?: string; createdAt: string; details?: unknown }
export interface EquipmentItem {
  id: string;
  name: string;
  ca: string;
  employee: string;
  condition: string;
  owner: string;
  kind: 'helmet' | 'glasses' | 'harness' | 'hearing';
  replace?: boolean;
  stockLow?: boolean;
}
