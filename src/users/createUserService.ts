import { ApiUserService } from './ApiUserService';
import type { UserService } from './UserService';
export const userService: UserService = new ApiUserService();
