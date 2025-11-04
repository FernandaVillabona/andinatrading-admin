import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    };
  }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}`, this.getHeaders());
  }

  createUser(data: any) {
    return this.http.post(`${this.apiUrl}`, data, this.getHeaders());
  }

  updateUser(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data, this.getHeaders());
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
}
}