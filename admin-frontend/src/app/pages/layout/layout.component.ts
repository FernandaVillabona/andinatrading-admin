// src/app/layout/layout.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  // Sidebar
  sidebarOpen = true;

  // Usuario
  nombreUsuario = 'Administrador';

  // Modal Perfil
  showProfileModal = false;
  tab: 'nombre' | 'password' = 'nombre';
  formNombre = '';
  pwd = { actual: '', nueva: '', confirmar: '' };
  saving = false;
  msgOk = '';
  msgError = '';

  constructor(
    private router: Router,
    private profile: ProfileService
  ) {}

  ngOnInit() {
    // Recuperar datos guardados en localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const u = JSON.parse(userData);
      const nombre = (u.nombre || '').trim();
      const apellido = (u.apellido || '').trim();
      this.nombreUsuario = (nombre || apellido) ? `${nombre} ${apellido}`.trim() : (nombre || 'Administrador');
    } else {
      // (opcional) Traer desde API para sincronizar
      this.profile.getMe().subscribe({
        next: (me) => (this.nombreUsuario = me.nombre_completo || 'Administrador'),
        error: () => {}
      });
    }
  }

  // Sidebar
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Auth
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.router.navigate(['']);
  }

  // Modal Perfil
  openProfileModal() {
    this.msgOk = this.msgError = '';
    this.tab = 'nombre';
    this.formNombre = this.nombreUsuario;
    this.pwd = { actual: '', nueva: '', confirmar: '' };
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.saving = false;
    this.msgOk = this.msgError = '';
  }

  // Guardar nombre
  guardarNombre() {
    const nombre = (this.formNombre || '').trim();
    if (nombre.length < 3) {
      this.msgError = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    this.saving = true;
    this.msgOk = this.msgError = '';
    this.profile.updateMyName(nombre).subscribe({
      next: (res) => {
        this.msgOk = res.message || 'Nombre actualizado';
        this.nombreUsuario = nombre;

        // Refrescar localStorage por si la app lo usa en otros lugares
        const raw = localStorage.getItem('userData');
        if (raw) {
          const u = JSON.parse(raw);
          u.nombre = nombre;
          delete u.apellido; // si no lo manejas, evita mostrar "undefined"
          localStorage.setItem('userData', JSON.stringify(u));
        }

        setTimeout(() => this.closeProfileModal(), 900);
      },
      error: (e) => {
        this.msgError = e?.error?.error || 'No se pudo actualizar el nombre';
        this.saving = false;
      }
    });
  }

  // Cambiar contraseña
  cambiarPassword() {
    this.msgOk = this.msgError = '';

    if (!this.pwd.actual || !this.pwd.nueva || !this.pwd.confirmar) {
      this.msgError = 'Completa todos los campos';
      return;
    }
    if (this.pwd.nueva.length < 8) {
      this.msgError = 'La nueva contraseña debe tener al menos 8 caracteres';
      return;
    }
    if (this.pwd.nueva !== this.pwd.confirmar) {
      this.msgError = 'La confirmación no coincide';
      return;
    }

    this.saving = true;
    this.profile.changeMyPassword(this.pwd.actual, this.pwd.nueva).subscribe({
      next: (res) => {
        this.msgOk = res.message || 'Contraseña actualizada';
        setTimeout(() => this.closeProfileModal(), 900);
      },
      error: (e) => {
        this.msgError = e?.error?.error || 'No se pudo actualizar la contraseña';
        this.saving = false;
      }
    });
  }
}
