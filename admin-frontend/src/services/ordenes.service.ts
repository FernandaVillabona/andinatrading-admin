import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment';
import { Observable } from 'rxjs';

export interface Orden {
  id_orden: number;
  tipo_orden: 'COMPRA' | 'VENTA' | string;
  estado: string;
  valor_orden: number;
  valor_comision: number;
  fecha_creacion: string; // ISO (UTC)
  nombre_comisionista: string | null;
  nombre_inversionista: string | null;
  correo_inversionista: string | null;
  ciudad_inversionista: string | null;
  pais_inversionista: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private apiUrl = `${environment.apiUrl}/admin/ordenes`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }

  getOrdenes(): Observable<{ total: number; data: Orden[] }> {
    return this.http.get<{ total: number; data: Orden[] }>(this.apiUrl, this.getHeaders());
    // Devuelve exactamente el shape que mostraste: { total, data: [...] }
  }
}
