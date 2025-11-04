import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupsService, Backup } from '../../../services/backups.service';
import { ClockComponent } from '../../components/clock/clock/clock.component';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [CommonModule, FormsModule, ClockComponent],
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.scss']
})
export class BackupsComponent implements OnInit, OnDestroy {
  nombreUsuario = 'Administrador';
  horaActual = '';
  zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private relojInterval: any;

  backups: Backup[] = [];
  backupsFiltrados: Backup[] = [];
  loading = true;
  creando = false;
  filtroTexto = '';
downloadingIds = new Set<number>();
isDownloading(id: number) { return this.downloadingIds.has(id); }

  constructor(private backupsService: BackupsService) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const u = JSON.parse(userData);
      this.nombreUsuario = u.nombre || 'Administrador';
    }

    this.iniciarReloj();
    this.cargarBackups();
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

  cargarBackups() {
    this.loading = true;
   this.backupsService.getAll().subscribe({
  next: (res) => {
    this.backups = res;
    this.backupsFiltrados = [...this.backups];
  },
  error: (err) => {
    console.error('❌ Error cargando backups:', err);
    alert('Error al cargar backups');
  },
  complete: () => (this.loading = false),
});
  }

  generarBackup() {
    if (this.creando) return;
    this.creando = true;

    this.backupsService.create().subscribe({
      next: (res) => {
        alert(res.message || '✅ Backup generado correctamente');
        this.cargarBackups();
      },
      error: (err) => {
        console.error('❌ Error al generar backup:', err);
        alert('Error al generar el backup');
      },
      complete: () => (this.creando = false),
    });
  }

  eliminarBackup(id: number) {
    if (!confirm('¿Eliminar este backup? Esta acción no se puede deshacer.')) return;

    this.backupsService.delete(id).subscribe({
      next: (res) => {
        alert(res.message || '🗑️ Backup eliminado correctamente');
        this.cargarBackups();
      },
      error: (err) => {
        console.error('❌ Error eliminando backup:', err);
        alert('Error eliminando backup');
      },
    });
  }

  aplicarFiltro() {
    const texto = this.filtroTexto.toLowerCase();
    this.backupsFiltrados = this.backups.filter(
      (b) =>
        b.nombre_archivo.toLowerCase().includes(texto) ||
        b.usuario?.toLowerCase().includes(texto) ||
        b.tipo_backup.toLowerCase().includes(texto) ||
        b.estado.toLowerCase().includes(texto)
    );
  }

  editarBackup(backup: Backup) {
    alert(`Función de editar próximamente ✏️\n\nBackup: ${backup.nombre_archivo}`);
  }

descargarBackup(b: Backup) {
  this.downloadingIds.add(b.id);
  this.backupsService.download(b.id).subscribe({
    next: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.downloadingIds.delete(b.id);
    },
    error: () => {
      this.downloadingIds.delete(b.id);
      alert('Error al descargar');
    }
  });
}
}

