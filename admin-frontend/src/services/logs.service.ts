import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment';
import { Observable } from 'rxjs';

export interface LogEntry {
  id: number;
  usuario: string;
  accion: string;
  modulo: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root',
})
export class LogsService {
private apiUrl = `${environment.apiUrl}/admin/logs`; // igual que ahora

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }

  getAllLogs(): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(this.apiUrl, this.getHeaders());
  }
}
