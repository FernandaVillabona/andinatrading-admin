import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { ClockComponent } from '../../components/clock/clock/clock.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ClockComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  data: any = { resumen: {}, actividad: {} };
  loading = true;
  nombreUsuario = 'Administrador';
  horaActual = '';
  zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private relojInterval: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.cargarDatos();
    this.iniciarReloj();

    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const nombre = user.nombre || '';
      const apellido = user.apellido || '';
      this.nombreUsuario = `${nombre} ${apellido}`.trim();
    }
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  iniciarReloj() {
    const opciones: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    this.horaActual = new Date().toLocaleTimeString('es-ES', opciones);
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-ES', opciones);
    }, 1000);
  }

  cargarDatos() {
    this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        this.data = res;
      },
      error: (err) => console.error('Error al obtener datos del dashboard:', err),
      complete: () => (this.loading = false)
    });
  }

  getModuloClass(modulo: string): string {
  if (!modulo) return 'modulo-default';

  const mod = modulo.toLowerCase();
  if (mod.includes('autentic')) return 'modulo-autenticacion';
  if (mod.includes('usuario')) return 'modulo-usuarios';
  if (mod.includes('orden')) return 'modulo-ordenes';
  if (mod.includes('backup')) return 'modulo-backups';
  if (mod.includes('historial')) return 'modulo-historial';
  return 'modulo-default';
}

}
