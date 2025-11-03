// src/app/services/usuarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environment/environment';

export type TipoUsuario = 'ADMIN' | 'COMISIONISTA' | 'INVERSIONISTA';

export interface Usuario {
  id_global: number;
  tipo: TipoUsuario;
  nombre: string;
  correo: string;
  telefono?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  saldo?: number;
  fecha_alta?: string | null;
  estado?: string | null;
  porcentaje_comision?: number | null;
}

interface InviteAdminPayload {
  nombre_completo: string;
  correo: string;
}

interface InviteAdminResponse {
  message: string;
  data: {
    id: number;
    nombre_completo: string;
    correo: string;
    tipo_usuario: 'ADMIN';
    estado: 'ACTIVO';
  };
}

export interface UsuarioResumen {
  admins: number;
  comisionistas: number;
  inversionistas: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  // Backend: app.use("/api/admin/usuarios", usersAdminRoutes)
  private apiUrl = `${environment.apiUrl}/admin/usuarios`;

  constructor(private http: HttpClient) {}

  // ✅ Solo envía Authorization si hay token
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** ✉️ Invitar admin */
  inviteAdmin(nombre_completo: string, correo: string): Observable<InviteAdminResponse> {
    const payload: InviteAdminPayload = { nombre_completo, correo };
    return this.http.post<InviteAdminResponse>(
      `${this.apiUrl}/admins/invite`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  /** --- Extras que ya tenías --- */
  getResumen(): Observable<UsuarioResumen> {
    return this.http.get<UsuarioResumen>(
      `${this.apiUrl}/resumen/contadores`,
      { headers: this.authHeaders() }
    );
  }

  getAdmins(): Observable<Usuario[]> {
    return this.http
      .get<{ total: number; data: any[] }>(`${this.apiUrl}/admins`, { headers: this.authHeaders() })
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'ADMIN'))));
  }

  getComisionistas(): Observable<Usuario[]> {
    return this.http
      .get<{ total: number; data: any[] }>(`${this.apiUrl}/comisionistas`, { headers: this.authHeaders() })
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'COMISIONISTA'))));
  }

  getInversionistas(): Observable<Usuario[]> {
    return this.http
      .get<{ total: number; data: any[] }>(`${this.apiUrl}/inversionistas`, { headers: this.authHeaders() })
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'INVERSIONISTA'))));
  }

  private normalizeFromRaw(raw: any, tipo: TipoUsuario): Usuario {
    switch (tipo) {
      case 'ADMIN':
        return {
          id_global: raw.id_global ?? raw.id,
          tipo,
          nombre: raw.nombre_completo ?? raw.nombre ?? '',
          correo: raw.correo ?? '',
          telefono: raw.telefono ?? null,
          ciudad: raw.ciudad ?? null,
          pais: raw.pais ?? null,
          saldo: raw.saldo ?? 0,
          estado: raw.estado ?? null,
          fecha_alta: raw.fecha_alta ?? raw.fecha_creacion ?? null,
        };
      case 'COMISIONISTA':
        return {
          id_global: raw.id_global ?? raw.id,
          tipo,
          nombre: raw.nombre_completo ?? raw.nombre ?? '',
          correo: raw.correo ?? '',
          telefono: raw.telefono ?? null,
          ciudad: raw.ciudad ?? null,
          pais: raw.pais ?? null,
          saldo: raw.saldo ?? 0,
          fecha_alta: raw.fecha_alta ?? raw.created_at ?? null,
          porcentaje_comision: raw.porcentaje_comision ?? null,
        };
      case 'INVERSIONISTA':
        return {
          id_global: raw.id_global ?? raw.id,
          tipo,
          nombre: raw.nombre ?? '',
          correo: raw.correo ?? '',
          telefono: raw.telefono ?? null,
          ciudad: raw.ciudad ?? null,
          pais: raw.pais ?? null,
          saldo: raw.saldo ?? 0,
          fecha_alta: raw.fecha_alta ?? raw.ultima_conexion ?? null,
          porcentaje_comision: raw.porcentaje_comision ?? null,
        };
    }
  }
}
