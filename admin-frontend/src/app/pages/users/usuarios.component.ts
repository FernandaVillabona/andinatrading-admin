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

  resumen = { admins: 0, comisionistas: 0, inversionistas: 0, total: 0 };

  loading = true;
  data: Usuario[] = [];
  private dataAll: Usuario[] = [];
  page = 1;
  limit = 10;
  total = 0;
  total_pages = 0;

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
    this.cargarLista();
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

  trackById(index: number, item: Usuario): number | string {
    return item.id_global ?? index;
  }

  cargarLista() {
    this.loading = true;

    forkJoin({
      admins: this.usuariosService.getAdmins(),
      comisionistas: this.usuariosService.getComisionistas(),
      inversionistas: this.usuariosService.getInversionistas(),
    }).subscribe({
      next: ({ admins, comisionistas, inversionistas /*, resumen*/ }) => {
        this.dataAll = [...admins, ...comisionistas, ...inversionistas];

        this.resumen = {
          admins: admins.length,
          comisionistas: comisionistas.length,
          inversionistas: inversionistas.length,
          total: admins.length + comisionistas.length + inversionistas.length,
        };

        this.aplicarTodo();
      },
      error: (e) => console.error('❌ Error unificando usuarios:', e),
      complete: () => (this.loading = false),
    });
  }

  private aplicarTodo() {
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

    if (this.tipo) arr = arr.filter(u => u.tipo === this.tipo);

    arr = this.ordenarArreglo(arr, this.sort, this.order);

    this.total = arr.length;
    this.total_pages = Math.max(1, Math.ceil(this.total / this.limit));
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;
    this.data = arr.slice(start, end);
  }

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


  showInviteModal = false;
inviteNombre = '';
inviteCorreo = '';
inviteLoading = false;
inviteError = '';
inviteOk = '';

openInviteModal() {
  this.inviteNombre = '';
  this.inviteCorreo = '';
  this.inviteLoading = false;
  this.inviteError = '';
  this.inviteOk = '';
  this.showInviteModal = true;
}

closeInviteModal() {
  if (this.inviteLoading) return;
  this.showInviteModal = false;
}

private isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

isInviteValid(): boolean {
  return (this.inviteNombre || '').trim().length > 2 && this.isEmail(this.inviteCorreo);
}

submitInvite() {
  if (!this.isInviteValid() || this.inviteLoading) return;
  this.inviteLoading = true;
  this.inviteError = '';
  this.inviteOk = '';

  this.usuariosService.inviteAdmin(
    this.inviteNombre.trim(),
    this.inviteCorreo.trim().toLowerCase()
  ).subscribe({
    next: (res) => {
      this.inviteOk = res.message || 'Invitación enviada';
      this.cargarLista();
      setTimeout(() => this.closeInviteModal(), 800);
      this.inviteLoading = false;
    },
    error: (err) => {
      console.error('❌ Error invitando admin:', err);
      this.inviteError = err?.error?.error || 'No se pudo enviar la invitación';
      this.inviteLoading = false;
    }
  });
}
}
