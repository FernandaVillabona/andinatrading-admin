import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalisisService } from '../../../services/analisis.service';
import { Chart, registerables } from 'chart.js';
import { ClockComponent } from '../../components/clock/clock/clock.component'; // ⬅️ importa el reloj

Chart.register(...registerables);

type Tab = 'ACCIONES' | 'ORDENES' | 'MOVIMIENTOS' | 'TOP';

@Component({
  selector: 'app-analisis',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent], // ⬅️ añade ClockComponent aquí
  templateUrl: './analisis.component.html',
  styleUrls: ['./analisis.component.scss']
})
export class AnalisisComponent implements OnInit, OnDestroy {
  // Header
  nombreUsuario = 'Administrador';       // ⬅️ ahora existe
  horaActual = '';                       // ⬅️ ahora existe
  zona = 'America/Bogota';
  private relojInterval: any;            // ⬅️ control del intervalo

  // Tabs
  active: Tab = 'ACCIONES';
  loading = false;

  // filtros por tab
  fAcciones = { empresa: '', q: '' };
  fOrdenes  = { desde: '', hasta: '', tipo: '' as '' | 'COMPRA' | 'VENTA', q: '' };
  fMovs     = { inversionista_id: undefined as number | undefined, desde: '', hasta: '', q: '' };
  fTop      = { limit: 20, q: '' };

  // datos y paginado por tab
  acciones: any[] = []; accionesFiltradas: any[] = []; aPage = 1; aLimit = 10; aTotal = 0; aPages = 1;
  ordenes: any[]  = []; ordenesFiltradas: any[]  = []; oPage = 1; oLimit = 10; oTotal = 0; oPages = 1;
  movs: any[]     = []; movsFiltradas: any[]     = []; mPage = 1; mLimit = 10; mTotal = 0; mPages = 1;
  top: any[]      = []; topFiltradas: any[]      = []; tPage = 1; tLimit = 10; tTotal = 0; tPages = 1;

  // charts
  chAcciones?: Chart; chOrdenes?: Chart; chMovs?: Chart; chTop?: Chart;

  constructor(private api: AnalisisService) {}

  ngOnInit() {
    // lee nombre desde localStorage si existe
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const u = JSON.parse(userData);
        const nombre = u?.nombre ?? '';
        const apellido = u?.apellido ?? '';
        const full = `${nombre} ${apellido}`.trim();
        if (full) this.nombreUsuario = full;
      } catch {}
    }

    this.iniciarReloj();        // ⬅️ inicia horaActual
    this.loadTab('ACCIONES');   // carga primer tab
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
    this.destroyCharts();
  }

  private iniciarReloj() {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: this.zona };
    this.horaActual = new Date().toLocaleTimeString('es-ES', opts);
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-ES', opts);
    }, 1000);
  }

  setTab(t: Tab) { this.active = t; this.loadTab(t); }

  // --------- LOADERS ----------
  loadTab(t: Tab) {
    this.loading = true;
    switch (t) {
      case 'ACCIONES':
        this.api.accionesActuales({ empresa: this.fAcciones.empresa || undefined }).subscribe({
          next: rows => { this.acciones = rows ?? []; this.aPage = 1; this.applyAcciones(); this.drawAcciones(); },
          error: e => console.error(e), complete: () => this.loading = false
        });
        break;

      case 'ORDENES':
        this.api.historialOrdenes({
          desde: this.fOrdenes.desde || undefined,
          hasta: this.fOrdenes.hasta || undefined,
          tipo:  this.fOrdenes.tipo  || undefined,
        }).subscribe({
          next: rows => { this.ordenes = rows ?? []; this.oPage = 1; this.applyOrdenes(); this.drawOrdenes(); },
          error: e => console.error(e), complete: () => this.loading = false
        });
        break;

      case 'MOVIMIENTOS': {
        const movParams: any = {};
        if (this.fMovs.inversionista_id) movParams.inversionista_id = this.fMovs.inversionista_id;
        if (this.fMovs.desde)            movParams.desde = this.fMovs.desde;
        if (this.fMovs.hasta)            movParams.hasta = this.fMovs.hasta;

        this.api.movimientos(movParams as any).subscribe({
          next: rows => { this.movs = rows ?? []; this.mPage = 1; this.applyMovs(); this.drawMovs(); },
          error: e => console.error(e), complete: () => this.loading = false
        });
        break;
      }

      case 'TOP':
        this.api.topEmpresas({ limit: this.fTop.limit }).subscribe({
          next: rows => { this.top = rows ?? []; this.tPage = 1; this.applyTop(); this.drawTop(); },
          error: e => console.error(e), complete: () => this.loading = false
        });
        break;
    }
  }

  // --------- FILTER + PAGINATION ----------
  private norm(s: any) {
    return String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  applyAcciones() {
    const q = this.norm(this.fAcciones.q);
    let arr = !q ? [...this.acciones] : this.acciones.filter(r =>
      [r.empresa, r.nombre_empresa, r.ticker, r.simbolo].some(x => this.norm(x).includes(q))
    );
    this.aTotal = arr.length; this.aPages = Math.max(1, Math.ceil(this.aTotal / this.aLimit));
    const ini = (this.aPage - 1) * this.aLimit, fin = ini + this.aLimit;
    this.accionesFiltradas = arr.slice(ini, fin);
  }

  applyOrdenes() {
    const q = this.norm(this.fOrdenes.q);
    let arr = !q ? [...this.ordenes] : this.ordenes.filter(o =>
      [o.id_orden, o.tipo_orden, o.estado, o.nombre_comisionista, o.nombre_inversionista]
        .some(x => this.norm(x).includes(q))
    );
    this.oTotal = arr.length; this.oPages = Math.max(1, Math.ceil(this.oTotal / this.oLimit));
    const ini = (this.oPage - 1) * this.oLimit, fin = ini + this.oLimit;
    this.ordenesFiltradas = arr.slice(ini, fin);
  }

  applyMovs() {
    const q = this.norm(this.fMovs.q);
    let arr = !q ? [...this.movs] : this.movs.filter(m =>
      [m.inversionista, m.nombre_inversionista, m.tipo, m.detalle]
        .some(x => this.norm(x).includes(q))
    );
    this.mTotal = arr.length; this.mPages = Math.max(1, Math.ceil(this.mTotal / this.mLimit));
    const ini = (this.mPage - 1) * this.mLimit, fin = ini + this.mLimit;
    this.movsFiltradas = arr.slice(ini, fin);
  }

  applyTop() {
    const q = this.norm(this.fTop.q);
    let arr = !q ? [...this.top] : this.top.filter(t => this.norm(t.empresa).includes(q));
    this.tTotal = arr.length; this.tPages = Math.max(1, Math.ceil(this.tTotal / this.tLimit));
    const ini = (this.tPage - 1) * this.tLimit, fin = ini + this.tLimit;
    this.topFiltradas = arr.slice(ini, fin);
  }

  // --------- CHARTS ----------
  destroyCharts() { this.chAcciones?.destroy(); this.chOrdenes?.destroy(); this.chMovs?.destroy(); this.chTop?.destroy(); }

  private drawAcciones() {
    this.chAcciones?.destroy();
    const labels = this.acciones.map(a => a.empresa || a.nombre_empresa || a.ticker || a.simbolo);
    const data   = this.acciones.map(a => Number(a.precio ?? a.precio_actual ?? 0));
    this.chAcciones = new Chart('chAcciones', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Precio actual', data }] },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  private drawOrdenes() {
    this.chOrdenes?.destroy();
    const map = new Map<string, number>();
    for (const o of this.ordenes) {
      const d = new Date(o.fecha || o.fecha_creacion).toISOString().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    const labels = [...map.keys()].sort();
    const data   = labels.map(k => map.get(k) ?? 0);
    this.chOrdenes = new Chart('chOrdenes', {
      type: 'line',
      data: { labels, datasets: [{ label: 'Órdenes por día', data, fill: true, tension: 0.3 }] },
      options: { responsive: true }
    });
  }

  private drawMovs() {
    this.chMovs?.destroy();
    const agg = new Map<string, number>();
    for (const m of this.movs) {
      const k = String(m.tipo || 'OTRO').toUpperCase();
      agg.set(k, (agg.get(k) ?? 0) + Number(m.monto ?? 0));
    }
    const labels = [...agg.keys()];
    const data   = labels.map(k => agg.get(k) ?? 0);
    this.chMovs = new Chart('chMovs', {
      type: 'doughnut',
      data: { labels, datasets: [{ data }] },
      options: { responsive: true }
    });
  }

  private drawTop() {
    this.chTop?.destroy();
    const labels = this.top.map(t => t.empresa);
    const data1  = this.top.map(t => Number(t.total_ordenes ?? 0));
    const data2  = this.top.map(t => Number(t.volumen ?? 0));
    this.chTop = new Chart('chTop', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Órdenes', data: data1 },
          { label: 'Volumen', data: data2 }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  // --------- PAGINADORES ----------
  aPag(d: number){ const n = this.aPage + d; if (n < 1 || n > this.aPages) return; this.aPage = n; this.applyAcciones(); }
  oPag(d: number){ const n = this.oPage + d; if (n < 1 || n > this.oPages) return; this.oPage = n; this.applyOrdenes(); }
  mPag(d: number){ const n = this.mPage + d; if (n < 1 || n > this.mPages) return; this.mPage = n; this.applyMovs(); }
  tPag(d: number){ const n = this.tPage + d; if (n < 1 || n > this.tPages) return; this.tPage = n; this.applyTop(); }
}
