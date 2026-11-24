export const USER_ROLES = ['ADMIN', 'GESTOR', 'FUNCIONARIO'] as const;
export type UserRole = typeof USER_ROLES[number];
export const isUserRole = (value: unknown): value is UserRole => USER_ROLES.includes(value as UserRole);
export interface Usuario {
  id: number;
  email: string;
  papel: UserRole;
  ativo: boolean;
  precisaTrocarSenha: boolean;
  bloqueadoAte: string | null;
  criadoEm: string;
  funcionario: { id: number; nome: string } | null;
}
export interface CreateUserInput {
  email?: string;
  papel: UserRole;
  funcionarioId?: number;
  senhaTemporaria: string;
}
export interface UpdateUserInput { papel?: UserRole; ativo?: boolean }
export interface UserService {
  getAll(): Promise<Usuario[]>;
  create(input: CreateUserInput): Promise<Usuario>;
  update(id: number, input: UpdateUserInput): Promise<Usuario>;
  resetPassword(id: number, senhaTemporaria: string): Promise<void>;
}
