import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService, LogEntry as BackLogEntry } from '../../../services/logs.service';
import { OrdenesService, Orden } from '../../../services/ordenes.service';
import { ClockComponent } from '../../components/clock/clock/clock.component';

type LogEntryUI = BackLogEntry & { tipo: string };

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  // pestañas
  tab: 'eventos' | 'ordenes' = 'eventos';

  // Logs (eventos)
  logs: LogEntryUI[] = [];
  logsFiltrados: LogEntryUI[] = [];

  // Órdenes
  ordenes: Orden[] = [];
  ordenesFiltradas: Orden[] = [];

  // Estado UI
  loading = true;
  nombreUsuario = 'Administrador';
  horaActual = '';
  zonaHoraria = 'America/Bogota';
  private relojInterval: any;

  // Filtros compartidos
  filtroTexto = '';
  filtroTipo: string = '';     // '', 'CREACION', 'MODIFICACION', 'ELIMINACION', 'RESPALDO', 'OTRO'
  filtroModulo: string = '';
  modulosDisponibles: string[] = [];

  constructor(
    private logsService: LogsService,
    private ordenesService: OrdenesService
  ) {}

  ngOnInit() {
    this.iniciarReloj();
    this.cargarLogs();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  cambiarTab(nueva: 'eventos' | 'ordenes') {
    this.tab = nueva;
    if (nueva === 'ordenes' && this.ordenes.length === 0) {
      this.cargarOrdenes();
    } else {
      this.aplicarFiltro();
    }
  }

  iniciarReloj() {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    this.horaActual = new Date().toLocaleTimeString('es-ES', opts);
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-ES', opts);
    }, 1000);
  }

  // ------- Eventos / Logs -------
  cargarLogs() {
    this.loading = true;
    this.logsService.getAllLogs().subscribe({
      next: (rows) => {
        this.logs = rows.map(r => ({ ...r, tipo: this.derivarTipo(r.accion) }));
        this.modulosDisponibles = Array.from(new Set(this.logs.map(l => String(l.modulo)))).sort();
        this.logsFiltrados = [...this.logs];
      },
      error: (err) => console.error('Error cargando logs:', err),
      complete: () => (this.loading = false)
    });
  }

  derivarTipo(accion: string | null | undefined): string {
    const a = (accion || '').toLowerCase();
    if (/(crea|alta|nuevo)/.test(a)) return 'CREACION';
    if (/(modif|actualiz|cambio|edit)/.test(a)) return 'MODIFICACION';
    if (/(elim|borr|remov)/.test(a)) return 'ELIMINACION';
    if (/(respal|backup)/.test(a)) return 'RESPALDO';
    return 'OTRO';
  }

  setTipo(tipo: string) { this.filtroTipo = tipo; this.aplicarFiltro(); }
  setModulo(modulo: string) { this.filtroModulo = modulo; this.aplicarFiltro(); }

  ordenarPor(campo: keyof LogEntryUI) {
    this.logsFiltrados.sort((a: any, b: any) => ('' + a[campo]).localeCompare(b[campo]));
  }

  // ------- Órdenes -------
  cargarOrdenes() {
    this.loading = true;
    this.ordenesService.getOrdenes().subscribe({
      next: (res) => {
        this.ordenes = res.data ?? [];
        this.ordenesFiltradas = [...this.ordenes];
        this.aplicarFiltro();
      },
      error: (err) => console.error('Error cargando órdenes:', err),
      complete: () => (this.loading = false)
    });
  }

  ordenarOrdenesPor(campo: keyof Orden) {
    this.ordenesFiltradas.sort((a: any, b: any) => ('' + a[campo]).localeCompare(b[campo]));
  }

  // ------- Filtro compartido -------
  private normalize(v: any): string {
    return String(v ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().trim();
  }

  aplicarFiltro() {
    const q = this.normalize(this.filtroTexto);

    // Eventos
    this.logsFiltrados = this.logs.filter(l => {
      const matchTexto =
        this.normalize(l.usuario).includes(q) ||
        this.normalize(l.accion).includes(q) ||
        this.normalize(l.modulo).includes(q) ||
        this.normalize(l.id).includes(q) ||
        this.normalize(l.fecha).includes(q);
      const matchTipo = !this.filtroTipo || l.tipo === this.filtroTipo;
      const matchModulo = !this.filtroModulo || l.modulo === this.filtroModulo;
      return matchTexto && matchTipo && matchModulo;
    });

    // Órdenes
    this.ordenesFiltradas = this.ordenes.filter(o => {
      const matchTexto =
        this.normalize(o.id_orden).includes(q) ||
        this.normalize(o.tipo_orden).includes(q) ||
        this.normalize(o.estado).includes(q) ||
        this.normalize(o.valor_orden).includes(q) ||
        this.normalize(o.valor_comision).includes(q) ||
        this.normalize(o.fecha_creacion).includes(q) ||
        this.normalize(o.nombre_comisionista).includes(q) ||
        this.normalize(o.nombre_inversionista).includes(q) ||
        this.normalize(o.correo_inversionista).includes(q) ||
        this.normalize(o.ciudad_inversionista).includes(q) ||
        this.normalize(o.pais_inversionista).includes(q);
      return matchTexto;
    });
  }

  getTipoClass(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('creac')) return 'tipo-creacion';
    if (t.includes('modific')) return 'tipo-modificacion';
    if (t.includes('elimin')) return 'tipo-eliminacion';
    if (t.includes('respal')) return 'tipo-respaldo';
    return 'tipo-default';
  }

  getModuloClass(modulo: string): string {
    const m = (modulo || '').toLowerCase();
    if (m.includes('autentic')) return 'modulo-autenticacion';
    if (m.includes('usuario')) return 'modulo-usuarios';
    if (m.includes('orden')) return 'modulo-ordenes';
    if (m.includes('backup')) return 'modulo-backups';
    return 'modulo-default';
  }
}
