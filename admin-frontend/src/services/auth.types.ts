// src/app/services/auth.types.ts
export type UserRole = 'ADMIN' | 'COMISIONISTA' | 'INVERSIONISTA';

export interface UserInfo {
  id: number;
  nombre: string;          // viene de nombre_completo
  tipo: UserRole;          // mapea tipo_usuario
  correo?: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
  message?: string;
}
