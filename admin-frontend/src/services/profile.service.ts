// src/app/services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment/environment';

export interface MyProfile {
  id: number;
  nombre_completo: string;
  correo: string;
  tipo_usuario: 'ADMIN' | 'COMISIONISTA' | 'INVERSIONISTA';
  estado: 'ACTIVO' | 'INACTIVO';
  fecha_creacion: string;
  ultima_conexion: string | null;
}

export interface MsgResponse {
  message: string;
  warning?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** Obtener mi perfil */
  getMe(): Observable<MyProfile> {
    return this.http.get<MyProfile>(`${this.apiUrl}/me`, { headers: this.authHeaders() });
  }

  /** Actualizar mi nombre */
  updateMyName(nombre_completo: string): Observable<MsgResponse> {
    return this.http
      .patch<MsgResponse>(
        `${this.apiUrl}/me`,
        { nombre_completo },
        { headers: this.authHeaders() }
      )
      .pipe(
        // (opcional) refresca el nombre guardado en localStorage para el header de la app
        tap(() => {
          const raw = localStorage.getItem('userData');
          if (raw) {
            const u = JSON.parse(raw);
            u.nombre = nombre_completo;
            localStorage.setItem('userData', JSON.stringify(u));
          }
        })
      );
  }

  /** Cambiar mi contraseña (requiere contraseña actual) */
  changeMyPassword(actual: string, nueva: string): Observable<MsgResponse> {
    return this.http.patch<MsgResponse>(
      `${this.apiUrl}/me/password`,
      { actual, nueva },
      { headers: this.authHeaders() }
    );
  }
}
