import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private base = `${environment.apiUrl}/admin/analisis`;

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' }),
    };
  }

  accionesActuales(params?: { empresa?: string }): Observable<any[]> {
    let p = new HttpParams();
    if (params?.empresa) p = p.set('empresa', params.empresa);
    return this.http.get<any[]>(`${this.base}/acciones-actuales`, { ...this.headers(), params: p });
  }

  historialOrdenes(params?: { desde?: string; hasta?: string; tipo?: string }): Observable<any[]> {
    let p = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => v && (p = p.set(k, String(v))));
    return this.http.get<any[]>(`${this.base}/historial-ordenes`, { ...this.headers(), params: p });
  }

  movimientos(params?: { inversionista_id?: number }): Observable<any[]> {
    let p = new HttpParams();
    if (params?.inversionista_id) p = p.set('inversionista_id', params.inversionista_id);
    return this.http.get<any[]>(`${this.base}/movimientos`, { ...this.headers(), params: p });
  }

  topEmpresas(params?: { limit?: number }): Observable<any[]> {
    let p = new HttpParams();
    if (params?.limit) p = p.set('limit', params.limit);
    return this.http.get<any[]>(`${this.base}/top-empresas`, { ...this.headers(), params: p });
  }
}
