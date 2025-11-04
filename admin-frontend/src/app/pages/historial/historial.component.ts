import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { HistorialService } from '../../../services/historial.service';
import { ClockComponent } from '../../components/clock/clock/clock.component';

Chart.register(...registerables);

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent implements OnInit, OnDestroy {
  historial: any[] = [];
  historialFiltrado: any[] = [];
  resumen: any = {};
  filtroModulo = '';
  filtroEvento = '';
  modulosDisponibles: string[] = [];
  eventosDisponibles: string[] = [];
  loading = true;
  horaActual = '';
zonaHoraria = 'America/Bogota';
  nombreUsuario = 'Administrador';
  private relojInterval: any;
  filtro = '';
filtroTipo: string = '';

  constructor(private historialService: HistorialService) {}

  ngOnInit() {
    this.cargarResumen();
    this.cargarHistorial();
    this.iniciarReloj();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  iniciarReloj() {
    const opciones: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    this.horaActual = new Date().toLocaleTimeString('es-ES', opciones);
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-ES', opciones);
    }, 1000);
  }

  cargarHistorial() {
    this.historialService.getHistorial().subscribe({
      next: (res) => {
        this.historial = res;
        this.historialFiltrado = [...this.historial];
       this.modulosDisponibles = Array.from(
  new Set(res.map((e: any) => String(e.modulo)))
) as string[];

this.eventosDisponibles = Array.from(
  new Set(res.map((e: any) => String(e.tipo_evento)))
) as string[];

      },
      error: (err) => console.error('Error al obtener historial:', err),
      complete: () => (this.loading = false)
    });
  }

  cargarResumen() {
    this.historialService.getResumen().subscribe({
      next: (res) => {
        this.resumen = res.resumen;
        this.generarGraficas();
      },
      error: (err) => console.error('Error al obtener resumen:', err)
    });
  }

  generarGraficas() {
    const tipoLabels = this.resumen.por_tipo.map((t: any) => t.tipo_evento);
    const tipoData = this.resumen.por_tipo.map((t: any) => t.total);
    new Chart('chartTipo', {
      type: 'doughnut',
      data: {
        labels: tipoLabels,
        datasets: [{
          data: tipoData,
          backgroundColor: ['#a890ff', '#90f5d1', '#ffd580'],
          borderWidth: 1
        }]
      }
    });

    const modLabels = this.resumen.por_modulo.map((m: any) => m.modulo);
    const modData = this.resumen.por_modulo.map((m: any) => m.total);
    new Chart('chartModulo', {
      type: 'bar',
      data: {
        labels: modLabels,
        datasets: [{
          label: 'Total',
          data: modData,
          backgroundColor: '#8bb2ff'
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    const actLabels = this.resumen.actividad_30_dias.map((d: any) =>
      new Date(d.fecha).toLocaleDateString('es-ES')
    );
    const actData = this.resumen.actividad_30_dias.map((d: any) => d.total);
    new Chart('chartActividad', {
      type: 'line',
      data: {
        labels: actLabels,
        datasets: [{
          label: 'Eventos',
          data: actData,
          fill: true,
          backgroundColor: 'rgba(154, 140, 255, 0.2)',
          borderColor: '#5b4fc0',
          tension: 0.3
        }]
      }
    });
  }



  filtrarPorModulo() {
    if (!this.filtroModulo) return this.aplicarFiltro();
    this.historialFiltrado = this.historial.filter(
      (e) => e.modulo === this.filtroModulo
    );
  }

  filtrarPorEvento() {
    if (!this.filtroEvento) return this.aplicarFiltro();
    this.historialFiltrado = this.historial.filter(
      (e) => e.tipo_evento === this.filtroEvento
    );
  }

  ordenarPor(campo: string) {
    this.historialFiltrado.sort((a, b) =>
      ('' + a[campo]).localeCompare(b[campo])
    );
  }

  getModuloClass(modulo: string): string {
    if (!modulo) return 'modulo-default';
    const mod = modulo.toLowerCase();
    if (mod.includes('autentic')) return 'modulo-autenticacion';
    if (mod.includes('usuario')) return 'modulo-usuarios';
    if (mod.includes('orden')) return 'modulo-ordenes';
    if (mod.includes('backup')) return 'modulo-backups';
    return 'modulo-default';
  }





setTipo(tipo: string) {
  this.filtroTipo = tipo;
  this.aplicarFiltro();
}

private normalize(value: any): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

aplicarFiltro() {
  const f = this.normalize(this.filtro);

  this.historialFiltrado = this.historial.filter((e) => {
    const matchesText = Object.values(e).some((val) =>
      this.normalize(val).includes(f)
    );

    const tipo = this.normalize(e.tipo_evento);
    const matchesTipo = !this.filtroTipo || tipo === this.filtroTipo;

    return matchesText && matchesTipo;
  });
}

getTipoClass(tipo: string): string {
  if (!tipo) return 'tipo-default';
  const t = tipo.toLowerCase();
  if (t.includes('creac')) return 'tipo-creacion';
  if (t.includes('modific')) return 'tipo-modificacion';
  if (t.includes('elimin')) return 'tipo-eliminacion';
  if (t.includes('respal') || t.includes('backup')) return 'tipo-respaldo';
  return 'tipo-default';
}


}
