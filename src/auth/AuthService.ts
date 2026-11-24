import type { UserRole } from '../users/UserService';
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  papel: UserRole;
  precisaTrocarSenha: boolean;
  funcionarioId?: number | null;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  changePassword?(currentPassword: string, newPassword: string): Promise<AuthUser>;
}
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
