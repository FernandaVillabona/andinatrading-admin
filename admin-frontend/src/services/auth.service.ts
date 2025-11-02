// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse, UserInfo } from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:4000/api/admin'; // Ajusta si usas Railway o Render

  constructor(private http: HttpClient) {}

  /** 🔹 Iniciar sesión (devuelve token + user) */
  login(correo: string, contrasena: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { correo, contrasena })
      .pipe(tap((res) => this.setSession(res)));
  }

  /** 🔹 Guardar token + usuario en localStorage */
  private setSession(res: LoginResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userData', JSON.stringify(res.user));
  }

  /** 🔹 Verificar si el usuario está logueado */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /** 🔹 Obtener información del usuario actual */
  getUser(): UserInfo | null {
    const data = localStorage.getItem('userData');
    return data ? (JSON.parse(data) as UserInfo) : null;
  }

  /** 🔹 Cerrar sesión */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  }
}
