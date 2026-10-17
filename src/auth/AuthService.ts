export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
