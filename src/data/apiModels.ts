export type ObraStatusDto = 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export interface ObraDto { id: number; nome: string; endereco: string | null; status: ObraStatusDto; dataInicio: string | null; dataFim: string | null; alocacoes?: { id: number; funcionario: { id: number; nome: string; cargo: string | null } }[] }
export interface FuncionarioDto { id: number; nome: string; email: string; cargo: string | null; salario?: string | null; alocacoes: { id: number; obra: { id: number; nome: string; status: ObraStatusDto } }[] }
export interface AlocacaoDto { id: number; funcionarioId: number; obraId: number; criadoEm: string; funcionario: { id: number; nome: string; cargo: string | null }; obra: { id: number; nome: string; status: ObraStatusDto } }
export type CriarObraDto = { nome: string; endereco?: string; status?: ObraStatusDto; dataInicio?: string; dataFim?: string };
export type CriarFuncionarioDto = { nome: string; email: string; cargo?: string; salario?: string };
export type SalvarAlocacaoDto = { funcionarioId: number; obraId: number };
