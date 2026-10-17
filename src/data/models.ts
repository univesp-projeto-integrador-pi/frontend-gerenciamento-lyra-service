export interface Work {
  id: string;
  name: string;
  location?: string;
  progress?: number;
  workers?: number;
  manager?: string;
  attention?: boolean;
  active?: boolean;
  inspectionDate?: string;
}
export type NewWork = Omit<Work, 'id'>;
export type WorkUpdate = Partial<NewWork>;
export interface Employee {
  id: string;
  name: string;
  role: string;
  work: string;
  record: string;
  status: 'Em campo' | 'Pendente' | 'Ausente';
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
}
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
