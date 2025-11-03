import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../environment/environment';
import { Observable, map } from 'rxjs';

// 🔹 Modelo de datos
export interface Backup {
  id: number;
  nombre_archivo: string;
  tipo_backup: string;
  estado: string;
  fecha_creacion: string;
  usuario: string;
}

@Injectable({ providedIn: 'root' })
export class BackupsService {
  // ⚙️ Según tu app.js → app.use("/api/backups", backupRoutes);
  private apiUrl = `${environment.apiUrl}/backups`;

  constructor(private http: HttpClient) {}

  // 🔐 Token JWT
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  /**
   * 📦 Obtener todos los backups
   */
  getAll(): Observable<Backup[]> {
    return this.http.get<Backup[]>(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  /**
   * 💾 Crear nuevo backup (manual)
   */
  create(): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, {}, { headers: this.getHeaders() });
  }

  /**
   * 🗑️ Eliminar backup por ID
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  /**
   * ⬇️ Descargar backup por ID
   * Backend esperado: GET /api/backups/descargar/:id
   * Retorna { blob, filename }
   */
  download(id: number): Observable<{ blob: Blob; filename: string }> {
    return this.http.get(`${this.apiUrl}/descargar/${id}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((resp: HttpResponse<Blob>) => {
        const filename = this.extractFilename(resp) || `backup_${id}.sql`;
        return { blob: resp.body as Blob, filename };
      })
    );
  }

  private extractFilename(resp: HttpResponse<Blob>): string | null {
    const cd = resp.headers.get('Content-Disposition') || resp.headers.get('content-disposition') || '';
    // filename="nombre.ext"
    const m1 = /filename="([^"]+)"/i.exec(cd);
    if (m1?.[1]) return m1[1];
    // filename*=UTF-8''nombre%20con%20espacios.ext
    const m2 = /filename\*\=UTF-8''([^;]+)/i.exec(cd);
    if (m2?.[1]) return decodeURIComponent(m2[1]);
    return null;
  }
}
