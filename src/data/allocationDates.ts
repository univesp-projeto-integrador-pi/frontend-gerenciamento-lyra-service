import type { Allocation } from './models';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function allocationEnded(record: Allocation) { return record.source !== 'api' && Boolean(record.endDate && record.endDate < today()); }
export function allocationCurrent(record: Allocation) { return record.source === 'api' || Boolean(record.startDate && record.startDate <= today()) && !allocationEnded(record); }
export function allocationLabel(record: Allocation) { return record.source === 'api' ? 'Vínculo cadastrado' : allocationEnded(record) ? 'Encerrada' : record.startDate && record.startDate > today() ? 'Programada' : 'Ativa'; }
