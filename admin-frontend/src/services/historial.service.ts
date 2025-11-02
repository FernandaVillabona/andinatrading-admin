import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = 'http://localhost:4000/api/historial';

  constructor(private http: HttpClient) {}

  getHistorial(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getByModulo(modulo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/modulo/${modulo}`);
  }

  getByEvento(tipo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/evento/${tipo}`);
  }

  getPaginado(page: number, limit: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/paginado?page=${page}&limit=${limit}`);
  }

  getResumen(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumen`);
  }
}
