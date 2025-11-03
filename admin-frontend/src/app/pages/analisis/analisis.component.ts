import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalisisService, AccionActual, OrdenHist, Movimiento, TopEmpresa } from '../../../services/analisis.service';
import { Chart, registerables } from 'chart.js';
import { ClockComponent } from '../../components/clock/clock/clock.component';

Chart.register(...registerables);

type Tab = 'ACCIONES' | 'ORDENES' | 'MOVIMIENTOS' | 'TOP';

@Component({
  selector: 'app-analisis',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent],
  templateUrl: './analisis.component.html',
  styleUrls: ['./analisis.component.scss']
})
export class AnalisisComponent implements OnInit, OnDestroy {
  // Header
  nombreUsuario = 'Administrador';
  horaActual = '';
  zona = 'America/Bogota';
  private relojInterval: any;

  // Tabs
  active: Tab = 'ACCIONES';
  loading = false;

  // Filtros
  fAcciones = { q: '' };
  fOrdenes  = { desde: '', hasta: '', tipo: '' as '' | 'COMPRA' | 'VENTA', q: '' };
  fMovs     = { inversionista_id: undefined as number | undefined, desde: '', hasta: '', q: '' };
  fTop      = { estado: '', q: '' };

  // Datos + paginación por tab
  acciones: AccionActual[] = []; accionesFiltradas: AccionActual[] = []; aPage = 1; aLimit = 10; aTotal = 0; aPages = 1;
  ordenes:  OrdenHist[]    = []; ordenesFiltradas:  OrdenHist[]    = []; oPage = 1; oLimit = 10; oTotal = 0; oPages = 1;
  movs:     Movimiento[]   = []; movsFiltradas:     Movimiento[]   = []; mPage = 1; mLimit = 10; mTotal = 0; mPages = 1;
  top:      TopEmpresa[]   = []; topFiltradas:      TopEmpresa[]   = []; tPage = 1; tLimit = 10; tTotal = 0; tPages = 1;

  // Charts
  chAcciones?: Chart; chOrdenes?: Chart; chMovs?: Chart; chTop?: Chart;

  constructor(private api: AnalisisService) {}

  ngOnInit() {
    // nombre en header desde localStorage si existe
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

    this.iniciarReloj();
    this.loadTab('ACCIONES');
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

  setTab(t: Tab) {
    this.active = t;
    this.loadTab(t);
  }

  // --------- CARGA POR TAB ----------
  loadTab(t: Tab) {
    this.loading = true;
    switch (t) {
      case 'ACCIONES':
        this.api.accionesActuales().subscribe({
          next: (rows) => {
            this.acciones = rows ?? [];
            this.aPage = 1;
            this.applyAcciones();
            this.drawAcciones();
          },
          error: (e) => console.error('❌ Acciones:', e),
          complete: () => (this.loading = false),
        });
        break;

      case 'ORDENES':
        this.api.historialOrdenes().subscribe({
          next: (rows) => {
            this.ordenes = rows ?? [];
            this.oPage = 1;
            this.applyOrdenes();
            this.drawOrdenes();
          },
          error: (e) => console.error('❌ Órdenes:', e),
          complete: () => (this.loading = false),
        });
        break;

      case 'MOVIMIENTOS': {
        const movParams: any = {};
        if (this.fMovs.inversionista_id) movParams.inversionista_id = this.fMovs.inversionista_id;
        if (this.fMovs.desde)            movParams.desde = this.fMovs.desde;
        if (this.fMovs.hasta)            movParams.hasta = this.fMovs.hasta;

        this.api.movimientos(movParams).subscribe({
          next: (rows) => {
            this.movs = rows ?? [];
            this.mPage = 1;
            this.applyMovs();
            this.drawMovs();
          },
          error: (e) => console.error('❌ Movimientos:', e),
          complete: () => (this.loading = false),
        });
        break;
      }

      case 'TOP':
        this.api.topEmpresas(this.fTop.estado ? { estado: this.fTop.estado } : undefined).subscribe({
          next: (rows) => {
            this.top = rows ?? [];
            this.tPage = 1;
            this.applyTop();
            this.drawTop();
          },
          error: (e) => console.error('❌ Top empresas:', e),
          complete: () => (this.loading = false),
        });
        break;
    }
  }

  // --------- FILTRO + PAGINACIÓN ----------
  private norm(s: any) {
    return String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  applyAcciones() {
    const q = this.norm(this.fAcciones.q);
    let arr = !q
      ? [...this.acciones]
      : this.acciones.filter(r =>
          [r.empresa, r.inversionista].some(x => this.norm(x).includes(q))
        );
    this.aTotal = arr.length;
    this.aPages = Math.max(1, Math.ceil(this.aTotal / this.aLimit));
    const ini = (this.aPage - 1) * this.aLimit, fin = ini + this.aLimit;
    this.accionesFiltradas = arr.slice(ini, fin);
  }

  applyOrdenes() {
    const q = this.norm(this.fOrdenes.q);
    let arr = !q
      ? [...this.ordenes]
      : this.ordenes.filter(o =>
          [o.tipo_orden, o.estado, o.comisionista, o.inversionista, o.empresa]
            .some(x => this.norm(x).includes(q))
        );
    // filtros de fecha/tipo si decides aplicarlos en front (además del back):
    if (this.fOrdenes.tipo) {
      arr = arr.filter(o => (o.tipo_orden ?? '').toUpperCase() === this.fOrdenes.tipo);
    }
    if (this.fOrdenes.desde) {
      const d = Date.parse(this.fOrdenes.desde);
      arr = arr.filter(o => Date.parse(o.fecha_creacion) >= d);
    }
    if (this.fOrdenes.hasta) {
      const h = Date.parse(this.fOrdenes.hasta) + 24 * 3600 * 1000; // fin de día
      arr = arr.filter(o => Date.parse(o.fecha_creacion) < h);
    }

    this.oTotal = arr.length;
    this.oPages = Math.max(1, Math.ceil(this.oTotal / this.oLimit));
    const ini = (this.oPage - 1) * this.oLimit, fin = ini + this.oLimit;
    this.ordenesFiltradas = arr.slice(ini, fin);
  }

  applyMovs() {
    const q = this.norm(this.fMovs.q);
    let arr = !q
      ? [...this.movs]
      : this.movs.filter(m =>
          [m.nombre_inversionista, m.tipo, m.empresa]
            .some(x => this.norm(x).includes(q))
        );
    // filtros opcionales en front
    if (this.fMovs.desde) {
      const d = Date.parse(this.fMovs.desde);
      arr = arr.filter(m => Date.parse(m.fecha) >= d);
    }
    if (this.fMovs.hasta) {
      const h = Date.parse(this.fMovs.hasta) + 24 * 3600 * 1000;
      arr = arr.filter(m => Date.parse(m.fecha) < h);
    }

    this.mTotal = arr.length;
    this.mPages = Math.max(1, Math.ceil(this.mTotal / this.mLimit));
    const ini = (this.mPage - 1) * this.mLimit, fin = ini + this.mLimit;
    this.movsFiltradas = arr.slice(ini, fin);
  }

  applyTop() {
    const q = this.norm(this.fTop.q);
    let arr = !q ? [...this.top] : this.top.filter(t => this.norm(t.empresa).includes(q));
    this.tTotal = arr.length;
    this.tPages = Math.max(1, Math.ceil(this.tTotal / this.tLimit));
    const ini = (this.tPage - 1) * this.tLimit, fin = ini + this.tLimit;
    this.topFiltradas = arr.slice(ini, fin);
  }

  // --------- CHARTS ----------
  destroyCharts() {
    this.chAcciones?.destroy();
    this.chOrdenes?.destroy();
    this.chMovs?.destroy();
    this.chTop?.destroy();
  }

  private drawAcciones() {
    this.chAcciones?.destroy();
    const labels = this.acciones.map(a => a.empresa ?? '(sin empresa)');
    const data   = this.acciones.map(a => Number(a.precio_actual ?? 0)); // del back
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
      const d = new Date(o.fecha_creacion).toISOString().slice(0, 10);
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
const data2  = this.top.map(t => Number((t as any).volumen ?? 0));
    this.chTop = new Chart('chTop', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Órdenes', data: data1 },
          { label: 'Monto total', data: data2 }
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
