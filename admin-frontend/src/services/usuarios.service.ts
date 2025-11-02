import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environment/environment';

// 🔹 Tipos
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

export interface UsuarioResumen {
  admins: number;
  comisionistas: number;
  inversionistas: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/admin/usuarios`;

  constructor(private http: HttpClient) {}

  // ✅ Headers con JWT
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }

  // 🔹 Resumen de totales
  getResumen(): Observable<UsuarioResumen> {
    return this.http.get<UsuarioResumen>(`${this.apiUrl}/resumen/contadores`, this.getHeaders());
  }

  // 🔹 Administradores
  getAdmins(): Observable<Usuario[]> {
    return this.http.get<{ total: number; data: any[] }>(`${this.apiUrl}/admins`, this.getHeaders())
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'ADMIN'))));
  }

  // 🔹 Comisionistas
  getComisionistas(): Observable<Usuario[]> {
    return this.http.get<{ total: number; data: any[] }>(`${this.apiUrl}/comisionistas`, this.getHeaders())
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'COMISIONISTA'))));
  }

  // 🔹 Inversionistas
  getInversionistas(): Observable<Usuario[]> {
    return this.http.get<{ total: number; data: any[] }>(`${this.apiUrl}/inversionistas`, this.getHeaders())
      .pipe(map(res => res.data.map(u => this.normalizeFromRaw(u, 'INVERSIONISTA'))));
  }

  // 🔹 Normaliza distintos formatos del back a tu interfaz Usuario
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
