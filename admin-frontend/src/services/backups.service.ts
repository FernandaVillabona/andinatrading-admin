import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class BackupsService {
  private apiUrl = `${environment.apiUrl}/backups`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    };
  }

  getBackups() {
    return this.http.get(this.apiUrl, this.getHeaders());
  }

  generateBackup() {
    return this.http.post(`${this.apiUrl}/generate`, {}, this.getHeaders());
  }
}
