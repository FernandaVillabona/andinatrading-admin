// src/app/pages/home/home.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginResponse } from '../../../services/auth.types';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  standalone: true,
imports: [CommonModule, FormsModule],

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  correo = '';
  contrasena = '';
  errorMsg = '';

  frases = [
    'Tu dinero, bajo control',
    'Invierte con confianza',
    'Controla, analiza y crece',
  ];
  indiceFrase = 0;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    setInterval(() => {
      this.indiceFrase = (this.indiceFrase + 1) % this.frases.length;
    }, 5000);
  }

onSubmit() {
  this.errorMsg = '';
  this.authService.login(this.correo, this.contrasena).subscribe({
    next: (res) => {
      console.log('✅ Login exitoso:', res);
      // 🔹 Redirigir correctamente al layout con dashboard
      this.router.navigate(['/admin/dashboard']);
    },
    error: (err) => {
      console.error('❌ Error al iniciar sesión:', err);
      this.errorMsg =
        err.error?.error ||
        err.error?.message ||
        'Credenciales incorrectas o sin permisos.';
    },
  });
}

}
