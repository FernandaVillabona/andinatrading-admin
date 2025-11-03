// src/app/services/analisis.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environment/environment';

/** Tipos mínimos */
export interface AccionActual {
  id_registro: number;
  inversionista_id: number | null;
  inversionista: string | null;
  empresa_id: number | null;
  empresa: string | null;
  cantidad_acciones: number | null;
  precio_actual: number | null;
  valor_total: number | null;
}
export interface OrdenHist {
  id_orden: number;
  tipo_orden: string;
  estado: string;
  numero_acciones: number | null;
  valor_orden: number | null;
  valor_comision: number | null;
  fecha_creacion: string;
  inversionista_id: number | null;
  inversionista: string | null;
  comisionista_id: number | null;
  comisionista: string | null;
  empresa_id: number | null;
  empresa: string | null;
}
export interface Movimiento {
  id: number;
  fecha: string;                 // ISO / datetime
  tipo: string | null;
  monto: number | null;
  empresa: string | null;
  inversionista_id: number | null;
  nombre_inversionista: string | null;
}
export interface TopEmpresa {
  empresa_id: number;
  empresa: string;
  total_ordenes: number;
  volumen: number;               // ← normalizado (usa monto_total si viene así)
  total_comisiones: number;
}

@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private base = `${environment.apiUrl}/admin/analisis`;

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' }) };
  }

  /** 📊 Acciones actuales -> back: { total, data } */
  accionesActuales(params?: { empresa?: string }): Observable<AccionActual[]> {
    let p = new HttpParams();
    if (params?.empresa) p = p.set('empresa', params.empresa);

    return this.http
      .get<{ total: number; data: AccionActual[] }>(`${this.base}/acciones-actuales`, {
        ...this.headers(),
        params: p,
      })
      .pipe(map(res => res.data ?? []));
  }

  /** 💰 Historial de órdenes -> back: { total, data } */
  historialOrdenes(params?: { desde?: string; hasta?: string; tipo?: 'COMPRA'|'VENTA'|'' }): Observable<OrdenHist[]> {
    let p = new HttpParams();
    if (params?.desde) p = p.set('desde', params.desde);
    if (params?.hasta) p = p.set('hasta', params.hasta);
    if (params?.tipo)  p = p.set('tipo',  params.tipo);

    return this.http
      .get<{ total: number; data: OrdenHist[] }>(`${this.base}/historial-ordenes`, {
        ...this.headers(),
        params: p,
      })
      .pipe(map(res => res.data ?? []));
  }

  /** 🪙 Movimientos -> el back devuelve array directo */
  movimientos(params?: { inversionista_id?: number; desde?: string; hasta?: string }): Observable<Movimiento[]> {
    let p = new HttpParams();
    if (params?.inversionista_id) p = p.set('inversionista_id', params.inversionista_id);
    if (params?.desde)            p = p.set('desde', params.desde);
    if (params?.hasta)            p = p.set('hasta', params.hasta);

    return this.http.get<Movimiento[]>(`${this.base}/movimientos`, { ...this.headers(), params: p });
  }

  /** 🏦 Top empresas -> back: { total, data }, normaliza "volumen" */
  topEmpresas(params?: { estado?: string; limit?: number }): Observable<TopEmpresa[]> {
    let p = new HttpParams();
    if (params?.estado) p = p.set('estado', params.estado);
    if (params?.limit)  p = p.set('limit',  params.limit);

    return this.http
      .get<{ total: number; data: any[] }>(`${this.base}/top-empresas`, { ...this.headers(), params: p })
      .pipe(
        map(res =>
          (res.data ?? []).map((r: any) => ({
            empresa_id: Number(r.empresa_id),
            empresa: String(r.empresa),
            total_ordenes: Number(r.total_ordenes ?? 0),
            volumen: Number(r.volumen ?? r.monto_total ?? 0),           // ← aquí la magia
            total_comisiones: Number(r.total_comisiones ?? 0),
          }) as TopEmpresa)
        )
      );
  }
}
