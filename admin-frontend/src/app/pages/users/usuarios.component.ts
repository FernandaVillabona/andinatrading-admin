// users.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../services/usuarios.service';
import { ClockComponent } from '../../components/clock/clock/clock.component';
import { forkJoin } from 'rxjs';

type TipoUsuario = 'ADMIN' | 'COMISIONISTA' | 'INVERSIONISTA' | '';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  // Header
  nombreUsuario = 'Administrador';
  horaActual = '';
  zonaHoraria = 'America/Bogota';
  private relojInterval: any;

  // Resumen
  resumen = { admins: 0, comisionistas: 0, inversionistas: 0, total: 0 };

  // Tabla / listado
  loading = true;
  data: Usuario[] = [];            // página visible
  private dataAll: Usuario[] = []; // universo unificado para filtrar/ordenar
  page = 1;
  limit = 10;
  total = 0;
  total_pages = 0;

  // Filtros
  q = '';
  tipo: TipoUsuario = '';
  sort: keyof Usuario | 'saldo' | 'fecha_alta' | 'nombre' = 'nombre';
  order: 'ASC' | 'DESC' = 'ASC';

  tiposPills: Array<{label:string, value:TipoUsuario, icon:string}> = [
    { label: 'Todos', value: '', icon: 'bi-people' },
    { label: 'Admins', value: 'ADMIN', icon: 'bi-person-badge' },
    { label: 'Comisionistas', value: 'COMISIONISTA', icon: 'bi-person-video3' },
    { label: 'Inversionistas', value: 'INVERSIONISTA', icon: 'bi-people-fill' },
  ];

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const u = JSON.parse(userData);
      const nombre = u.nombre || '';
      const apellido = u.apellido || '';
      this.nombreUsuario = `${nombre} ${apellido}`.trim() || 'Administrador';
    }

    this.iniciarReloj();
    this.cargarLista();      // unifica 3 endpoints y pinta tabla
  }

  ngOnDestroy(): void {
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  iniciarReloj() {
    const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    this.horaActual = new Date().toLocaleTimeString('es-ES', opt);
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-ES', opt);
    }, 1000);
  }

  // trackBy para el *ngFor
  trackById(index: number, item: Usuario): number | string {
    return item.id_global ?? index;
  }

  // Unifica admins + comisionistas + inversionistas y aplica filtros
  cargarLista() {
    this.loading = true;

    forkJoin({
      admins: this.usuariosService.getAdmins(),
      comisionistas: this.usuariosService.getComisionistas(),
      inversionistas: this.usuariosService.getInversionistas(),
      // opcional: si quieres leer /resumen/contadores real del back
      // resumen: this.usuariosService.getResumen()
    }).subscribe({
      next: ({ admins, comisionistas, inversionistas /*, resumen*/ }) => {
        // 1) Unificado
        this.dataAll = [...admins, ...comisionistas, ...inversionistas];

        // 2) Resumen (si no usas endpoint de resumen)
        this.resumen = {
          admins: admins.length,
          comisionistas: comisionistas.length,
          inversionistas: inversionistas.length,
          total: admins.length + comisionistas.length + inversionistas.length,
        };

        // 3) Aplicar búsqueda + tipo + orden + paginación
        this.aplicarTodo();
      },
      error: (e) => console.error('❌ Error unificando usuarios:', e),
      complete: () => (this.loading = false),
    });
  }

  // Reaplica filtros, orden y paginación sobre dataAll
  private aplicarTodo() {
    // A) filtro por texto
    const q = (this.q || '').trim().toLowerCase();
    let arr = !q
      ? [...this.dataAll]
      : this.dataAll.filter(u =>
          (u.nombre ?? '').toLowerCase().includes(q) ||
          (u.correo ?? '').toLowerCase().includes(q) ||
          (u.ciudad ?? '').toLowerCase().includes(q) ||
          (u.pais ?? '').toLowerCase().includes(q) ||
          (u.tipo ?? '').toLowerCase().includes(q)
        );

    // B) filtro por tipo (pill)
    if (this.tipo) arr = arr.filter(u => u.tipo === this.tipo);

    // C) orden
    arr = this.ordenarArreglo(arr, this.sort, this.order);

    // D) paginación
    this.total = arr.length;
    this.total_pages = Math.max(1, Math.ceil(this.total / this.limit));
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;
    this.data = arr.slice(start, end);
  }

  // Orden genérico para Usuario[]
  private ordenarArreglo(
    arr: Usuario[],
    campo: typeof this.sort,
    order: 'ASC' | 'DESC'
  ): Usuario[] {
    const dir = order === 'ASC' ? 1 : -1;
    return [...arr].sort((a: any, b: any) => {
      const va = a?.[campo];
      const vb = b?.[campo];

      if (campo === 'saldo') {
        return (Number(va ?? 0) - Number(vb ?? 0)) * dir;
      }
      if (campo === 'fecha_alta') {
        return ((va ? Date.parse(va) : 0) - (vb ? Date.parse(vb) : 0)) * dir;
      }
      return String(va ?? '').toLowerCase()
        .localeCompare(String(vb ?? '').toLowerCase()) * dir;
    });
  }

  // Handlers UI (re-usan aplicarTodo)
  setTipo(t: TipoUsuario) {
    this.tipo = t;
    this.page = 1;
    this.aplicarTodo();
  }

  onSearchInput() {
    this.page = 1;
    this.aplicarTodo();
  }

  ordenarPor(campo: typeof this.sort) {
    if (this.sort === campo) {
      this.order = this.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sort = campo;
      this.order = 'ASC';
    }
    this.aplicarTodo();
  }

  cambiarPagina(delta: number) {
    const next = this.page + delta;
    if (next < 1 || next > this.total_pages) return;
    this.page = next;
    this.aplicarTodo();
  }

  cambiarLimite(nuevo: number) {
    this.limit = nuevo;
    this.page = 1;
    this.aplicarTodo();
  }

  // Helpers UI
  sortIcon(campo: typeof this.sort) {
    if (this.sort !== campo) return 'bi-arrow-down-up';
    return this.order === 'ASC' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  tipoBadgeClass(t: Usuario['tipo']) {
    switch (t) {
      case 'ADMIN': return 'tipo-admin';
      case 'COMISIONISTA': return 'tipo-comisionista';
      case 'INVERSIONISTA': return 'tipo-inversionista';
      default: return 'tipo-default';
    }
  }
}
