import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe o ha sido movida.</p>
      <a routerLink="/admin/dashboard" class="btn">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      text-align: center;
      padding: 4rem 2rem;
      color: #4b3fa6;
    }
    h1 {
      font-size: 5rem;
      margin: 0;
    }
    h2 {
      margin: 0.5rem 0;
      font-weight: 600;
    }
    p {
      margin-bottom: 2rem;
      color: #555;
    }
    .btn {
      background: linear-gradient(90deg, #a679e8, #d881a3);
      color: white;
      padding: 0.7rem 1.4rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
    }
    .btn:hover {
      opacity: 0.85;
    }
  `]
})
export class NotFoundComponent {}
