import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;
  nombreUsuario = 'Admin';

  constructor(private router: Router) {}

  ngOnInit() {
    // 🔹 Recuperar datos guardados en localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.nombreUsuario = `${user.nombre} ${user.apellido}` || user.nombre;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    // 🔐 Limpieza total de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('userData');

    // 🔹 Redirección correcta al login (ruta raíz)
    this.router.navigate(['']);
  }
}
